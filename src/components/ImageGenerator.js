import React, { useState } from 'react';
import { useAPIKey } from './APIKeyContext';

const models = [
  { id: "stabilityai/stable-diffusion-2", name: "Stable Diffusion 2", supportsNegativePrompt: true },
  { id: "runwayml/stable-diffusion-v1-5", name: "Stable Diffusion 1.5", supportsNegativePrompt: true },
  { id: "CompVis/stable-diffusion-v1-4", name: "Stable Diffusion 1.4", supportsNegativePrompt: true },
  { id: "black-forest-labs/FLUX.1-dev", name: "FLUX.1", supportsNegativePrompt: false }
];

const ImageGenerator = ({ onEditApiKey }) => {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(models[0].id);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { apiKey } = useAPIKey();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const selectedModelInfo = models.find(model => model.id === selectedModel);
      
      const requestBody = {
        inputs: prompt,
      };

      if (negativePrompt && selectedModelInfo.supportsNegativePrompt) {
        requestBody.parameters = { negative_prompt: negativePrompt };
      }

      const response = await fetch(
        `https://api-inference.huggingface.co/models/${selectedModel}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.blob();
      const imageUrl = URL.createObjectURL(result);
      setGeneratedImage(imageUrl);
    } catch (error) {
      console.error("Error generating image:", error);
      alert(`Error generating image: ${error.message}. Please check your API key and try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const currentModel = models.find(model => model.id === selectedModel);

  return (
    <div className="w-3/4 mx-auto bg-white border-4 border-black rounded-xl overflow-hidden shadow-xl">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-center">AI Image Generator</h2>
        <p className="text-center mt-2 text-gray-200 text-sm sm:text-base">All of the models. None of the subscriptions.</p>
      </div>
      <div className="p-6 bg-stone-50">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="model" className="block text-sm font-bold text-gray-700 mb-1">Select Model</label>
            <select
              id="model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full p-2 border-2 border-black rounded-md text-sm"
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="prompt" className="block text-sm font-bold text-gray-700 mb-1">Image Description</label>
            <input
              id="prompt"
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image"
              required
              className="w-full p-2 border-2 border-black rounded-md text-sm"
            />
          </div>
          {currentModel.supportsNegativePrompt && (
            <div>
              <label htmlFor="negativePrompt" className="block text-sm font-bold text-gray-700 mb-1">Negative Prompt (Optional)</label>
              <input
                id="negativePrompt"
                type="text"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="What to exclude from the image"
                className="w-full p-2 border-2 border-black rounded-md text-sm"
              />
            </div>
          )}
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-black text-white font-bold py-2 px-4 rounded-md hover:bg-gray-800 transition duration-300 disabled:opacity-50 text-sm sm:text-base"
          >
            {isLoading ? 'Generating...' : 'Generate Image'}
          </button>
        </form>
      </div>
      <div className="bg-stone-100 p-6">
        {generatedImage ? (
          <div className="w-full">
            <p className="text-center text-sm font-bold text-gray-700 mb-4">Your generated image:</p>
            <img src={generatedImage} alt="Generated" className="mx-auto rounded-md border-2 border-black shadow-lg" />
          </div>
        ) : (
          <div className="text-center text-gray-500 w-full">
            <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm font-bold">Your generated image will appear here</p>
          </div>
        )}
      </div>
      <div className="bg-stone-50 p-4 border-t-2 border-black">
        <button
          onClick={onEditApiKey}
          className="w-full bg-gray-200 text-black font-bold py-2 px-4 rounded-md hover:bg-gray-300 transition duration-300 text-sm"
        >
          Edit API Key
        </button>
      </div>
    </div>
  );
};

export default ImageGenerator;