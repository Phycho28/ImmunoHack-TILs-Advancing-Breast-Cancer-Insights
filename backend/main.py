from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import cv2
import numpy as np
import os
os.environ["SM_FRAMEWORK"] = "tf.keras"
import segmentation_models as sm
from patchify import patchify, unpatchify
import io
from PIL import Image
import base64

# Configure environment

# Constants
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406])
IMAGENET_STD = np.array([0.229, 0.224, 0.225])
SIZE_X = 512
SIZE_Y = 512
BACKBONE = 'efficientnetb0'
num_classes = 3
dropout_value = 0.3

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model setup
def create_model(dropout_value):
    model = sm.Unet(
        backbone_name=BACKBONE,
        input_shape=(SIZE_Y, SIZE_X, 3),
        encoder_weights='imagenet',
        classes=num_classes,
        activation=None,
        encoder_freeze=False
    )
    return model, sm.get_preprocessing(BACKBONE)

# Initialize model
model, preprocess_input = create_model(dropout_value)
model.load_weights('../models/best_model_efficient.keras')

def pad_image(image, patch_size):
    pad_h = (patch_size - image.shape[0] % patch_size) % patch_size
    pad_w = (patch_size - image.shape[1] % patch_size) % patch_size
    padded_image = np.pad(image, ((0, pad_h), (0, pad_w), (0, 0)), mode='constant')
    return padded_image, pad_h, pad_w

def remove_padding(reconstructed_image, pad_h, pad_w):
    if pad_h > 0:
        reconstructed_image = reconstructed_image[:-pad_h, :]
    if pad_w > 0:
        reconstructed_image = reconstructed_image[:, :-pad_w]
    return reconstructed_image

def process_image(image_array):
    patch_size = 512
    pred_patches = []
    
    # Pad the image
    padded_image, pad_h, pad_w = pad_image(image_array, patch_size)
    
    # Patchify the padded image
    img_patches = patchify(padded_image, (patch_size, patch_size, 3), step=patch_size).reshape(-1, patch_size, patch_size, 3)
    
    # Process each patch
    for patch in img_patches:
        patch = patch / 255.0
        patch = (patch - IMAGENET_MEAN) / IMAGENET_STD
        patch = np.expand_dims(patch, axis=0)
        
        # Model prediction
        predictions = model.predict(patch, verbose=0)
        y_pred = np.argmax(predictions, axis=3)
        final_patch = y_pred[0, :, :]
        pred_patches.append(final_patch)
    
    # Reconstruct the full image
    h, w, _ = padded_image.shape
    n_patches_h = h // patch_size
    n_patches_w = w // patch_size
    pred_patches = np.array(pred_patches).reshape(n_patches_h, n_patches_w, patch_size, patch_size)
    
    # Unpatchify and remove padding
    predicted_mask = unpatchify(pred_patches, padded_image.shape[:2])
    predicted_mask = remove_padding(predicted_mask, pad_h, pad_w)
    
    return predicted_mask

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        # Read and process the uploaded image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            return JSONResponse(content={"error": "Invalid image file"}, status_code=400)
        
        # Process the image
        predicted_mask = process_image(image)
        
        # Convert the predicted mask to a base64 string
        mask_image = Image.fromarray((predicted_mask * 85).astype(np.uint8))  # Scale values for better visibility
        buffered = io.BytesIO()
        mask_image.save(buffered, format="PNG")
        mask_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        return JSONResponse(content={
            "success": True,
            "mask": mask_base64
        })
        
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/")
async def root():
    return {"message": "Image Segmentation API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)