import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Brain, Upload, Image as ImageIcon, Loader2, Microscope, HeartPulse, Dna } from 'lucide-react';

function App() {
  const [inputImage, setInputImage] = useState<File | null>(null);
const [outputImage, setOutputImage] = useState<string | null>(null);
const [isProcessing, setIsProcessing] = useState(false);
const [error, setError] = useState<string | null>(null);

const onDrop = useCallback((acceptedFiles: File[]) => {
  const file = acceptedFiles[0];
  if (file) {
    setInputImage(file);
    setOutputImage(null);
    setError(null);
  }
}, []);

const { getRootProps, getInputProps, isDragActive } = useDropzone({
  onDrop,
  accept: {
    'image/*': ['.jpeg', '.jpg', '.png']
  },
  maxFiles: 1
});

const processImage = async () => {
  if (!inputImage) {
    setError("No image selected.");
    return;
  }

  setIsProcessing(true);
  setError(null);

  const formData = new FormData();
  formData.append("file", inputImage);

  try {
    const response = await fetch("http://localhost:8001/predict", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (data.success) {
      setOutputImage(`data:image/png;base64,${data.mask}`);
    } else {
      setError(data.error || "Error processing image.");
    }
  } catch (err) {
    setError("Error processing image. Please try again.");
  } finally {
    setIsProcessing(false);
  }
};

  return (
    <div className="min-h-screen bg-purple-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-700 to-purple-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <img 
              src="https://tiger.grand-challenge.org/static/tiger/images/tiger_logo.png"
              alt="TIGER Logo"
              className="h-16"
            />
          </div>
          <h1 className="text-3xl font-bold text-center">TILs Score Detection and Segmentation</h1>
          <p className="mt-2 text-xl text-center text-purple-100">for Breast Cancer Analysis</p>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-purple-900">Understanding TILs in Breast Cancer</h2>
              <p className="text-gray-700 mb-4 leading-relaxed">
                Tumor-infiltrating lymphocytes (TILs) are proving to be an important biomarker in cancer patients. They can play a crucial role in killing tumor cells, particularly in specific types of breast cancer.
              </p>
              <div className="flex items-center space-x-4 mt-6">
                <HeartPulse className="w-8 h-8 text-purple-600" />
                <span className="text-lg text-purple-900">Advanced AI-powered TILs Analysis</span>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://www.tilsinbreastcancer.org/wp-content/uploads/2019/02/TILs-Working-Group-Slide-1024x576.jpg"
                alt="TILs Analysis"
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Info Cards */}
      <section className="py-12 bg-purple-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <Dna className="w-8 h-8 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-purple-900">Molecular Subtypes</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Luminal A (HR+, Her2-)</li>
                <li>• Luminal B (HR+, Her2+)</li>
                <li>• Her2 enriched (HR-, Her2+)</li>
                <li>• Triple Negative (HR-, Her2-)</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <Brain className="w-8 h-8 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-purple-900">Why HER2 and TNBC?</h3>
              <p className="text-gray-700">
                Her2 positive and Triple Negative breast cancers show the worst prognosis, making them crucial subjects for research in prognostic and predictive biomarkers.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <Microscope className="w-8 h-8 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-purple-900">The Role of TILs</h3>
              <p className="text-gray-700">
                Identifying and measuring TILs can help to better target treatments, particularly immunotherapy, and may result in lower levels of other more aggressive treatments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content - Image Processing */}
      <main className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-8 text-center text-purple-900">AI-Powered TILs Analysis</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center text-purple-900">
                <Upload className="w-5 h-5 mr-2" />
                Upload Histopathology Image
              </h2>
              
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-500'}`}
              >
                <input {...getInputProps()} />
                <ImageIcon className="w-12 h-12 mx-auto text-purple-400" />
                <p className="mt-2 text-gray-600">
                  {isDragActive
                    ? 'Drop the image here'
                    : 'Drag & drop a histopathology image here, or click to select'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Supported formats: JPEG, PNG
                </p>
              </div>

              {inputImage && (
                <div className="mt-4">
                  <img
                    src={URL.createObjectURL(inputImage)}
                    alt="Input"
                    className="max-w-full rounded-lg"
                  />
                  <button
                    onClick={processImage}
                    disabled={isProcessing}
                    className={`mt-4 w-full py-2 px-4 rounded-lg text-white font-medium
                      ${isProcessing
                        ? 'bg-purple-400 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700'}`}
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Analyzing TILs...
                      </span>
                    ) : (
                      'Analyze TILs'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Output Section */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center text-purple-900">
                <Brain className="w-5 h-5 mr-2" />
                TILs Analysis Results
              </h2>
              
              {error ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                  {error}
                </div>
              ) : outputImage ? (
                <img
                  src={outputImage}
                  alt="Output"
                  className="max-w-full rounded-lg"
                />
              ) : (
                <div className="border-2 border-gray-200 rounded-lg p-8 text-center">
                  <ImageIcon className="w-12 h-12 mx-auto text-gray-300" />
                  <p className="mt-2 text-gray-500">
                    TILs analysis results will appear here
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-purple-900 text-white mt-8">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center">
            © 2024 TIGER: Tumor InfiltratingG lymphocytes in breast cancER. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;