const { GoogleGenAI } = require('@google/genai');
const ProductModel = require('../models/productModel');

exports.handleChat = async (req, res) => {
  const { message, history } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Gemini API key is not configured.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const products = await ProductModel.findAll();
    
    const productData = products.map(p => {
      return `Name: ${p.name}\nPrice: $${p.price}\nStock: ${p.stock > 0 ? p.stock : 'Out of stock'}\nDescription: ${p.description || 'N/A'}`;
    }).join('\n\n');

    const systemPrompt = `You are a helpful and polite sales assistant for an e-commerce store. 
Answer user queries naturally, as if talking in person. 
Here is the store's current product catalog:
${productData}

Only answer based on this product catalog. If asked about something else, politely decline.
If a user asks about availability or prices, use the catalog data. If they want to buy, tell them they can find the product on our website.
Keep responses concise, friendly, and helpful. Use a warm, in-person tone.`;

    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Understood. I will act as the sales assistant based solely on this product data.' }] }
    ];

    if (Array.isArray(history)) {
      history.forEach(msg => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text || msg.content }]
        });
      });
    }
    
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
    });

    res.json({ reply: response.text });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
};
