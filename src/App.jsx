import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Import local clothing assets
import denimJacketImg from './assets/denim_jacket.png';
import whiteSneakersImg from './assets/white_sneakers.png';
import brownSweaterImg from './assets/brown_sweater.png';
import blackTrousersImg from './assets/black_trousers.png';

// Default closet items
const INITIAL_CLOSET = [
  {
    id: '1',
    title: 'Classic Denim Jacket',
    category: 'Outerwear',
    image: denimJacketImg,
    brand: "Levi's",
    size: 'M',
    color: 'Slate Blue',
    colorHex: '#4682B4',
    tags: ['Casual', 'Classic', 'Blue', 'Denim'],
    notes: 'Versatile denim jacket, goes with almost anything. Fits perfectly and has a slightly washed look.'
  },
  {
    id: '2',
    title: 'Minimalist Leather Sneakers',
    category: 'Shoes',
    image: whiteSneakersImg,
    brand: 'Common Projects',
    size: 'US 9',
    color: 'White',
    colorHex: '#EAEAEA',
    tags: ['Minimalist', 'White', 'Leather', 'Essential'],
    notes: 'Premium white sneakers. Clean with sneaker wipes after every wear to keep them fresh.'
  },
  {
    id: '3',
    title: 'Cozy Knit Sweater',
    category: 'Tops',
    image: brownSweaterImg,
    brand: 'Everlane',
    size: 'L',
    color: 'Cocoa Brown',
    colorHex: '#8B4513',
    tags: ['Cozy', 'Wool', 'Brown', 'Warm'],
    notes: '100% merino wool knit sweater in rich brown. Dry clean or hand wash only.'
  },
  {
    id: '4',
    title: 'Tailored Slim Trousers',
    category: 'Bottoms',
    image: blackTrousersImg,
    brand: 'Theory',
    size: '32',
    color: 'Charcoal Black',
    colorHex: '#1C1917',
    tags: ['Smart Casual', 'Black', 'Tailored', 'Formal'],
    notes: 'Very comfortable tailored black trousers. Slim fit. Material is a lightweight wool-poly blend.'
  }
];

// Helper to compress uploaded image using HTML5 Canvas
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500;
        const MAX_HEIGHT = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress as image/jpeg at 0.7 quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

function App() {
  const [clothingItems, setClothingItems] = useState(() => {
    const saved = localStorage.getItem('closet_items');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing closet items", e);
      }
    }
    return INITIAL_CLOSET;
  });

  const [savedOutfits, setSavedOutfits] = useState(() => {
    const saved = localStorage.getItem('closet_outfits');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved outfits", e);
      }
    }
    return [];
  });

  const [activeTab, setActiveTab] = useState('closet');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);

  // Form state for adding items
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Tops');
  const [formBrand, setFormBrand] = useState('');
  const [formSize, setFormSize] = useState('');
  const [formColor, setFormColor] = useState('');
  const [formColorHex, setFormColorHex] = useState('#8C7853');
  const [formTags, setFormTags] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formImage, setFormImage] = useState(null);
  const [formImagePreview, setFormImagePreview] = useState('');

  // Edit Mode inside Details Modal state
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [editFormTitle, setEditFormTitle] = useState('');
  const [editFormBrand, setEditFormBrand] = useState('');
  const [editFormCategory, setEditFormCategory] = useState('Tops');
  const [editFormSize, setEditFormSize] = useState('');
  const [editFormColor, setEditFormColor] = useState('');
  const [editFormColorHex, setEditFormColorHex] = useState('#8C7853');
  const [editFormTags, setEditFormTags] = useState('');
  const [editFormNotes, setEditFormNotes] = useState('');
  const [editFormImagePreview, setEditFormImagePreview] = useState('');

  // Outfit Builder Panel/Tab state
  const [builderName, setBuilderName] = useState('');
  const [builderNotes, setBuilderNotes] = useState('');
  const [selectedBuilderTop, setSelectedBuilderTop] = useState(null);
  const [selectedBuilderBottom, setSelectedBuilderBottom] = useState(null);
  const [selectedBuilderOuterwear, setSelectedBuilderOuterwear] = useState(null);
  const [selectedBuilderShoes, setSelectedBuilderShoes] = useState(null);

  // Custom Toast State
  const [toast, setToast] = useState({ show: false, message: '' });
  const toastTimeoutRef = useRef(null);

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({ show: false, message: '', onConfirm: null });

  // AI Outfit Advisor state
  const [outfitOccasion, setOutfitOccasion] = useState('Casual Sunday');
  const [isGeneratingOutfit, setIsGeneratingOutfit] = useState(false);
  const [generatedOutfit, setGeneratedOutfit] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [advisorChat, setAdvisorChat] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Welcome to your digital wardrobe consultant. Select an occasion on the right to curate a styled outfit layout, or ask a styling inquiry below."
    }
  ]);

  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [advisorChat, isChatting]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('closet_items', JSON.stringify(clothingItems));
  }, [clothingItems]);

  useEffect(() => {
    localStorage.setItem('closet_outfits', JSON.stringify(savedOutfits));
  }, [savedOutfits]);

  // Generate outfit recommendation based on occasion
  useEffect(() => {
    if (activeTab === 'advisor' && !generatedOutfit) {
      handleGenerateOutfit(outfitOccasion);
    }
  }, [activeTab]);

  // Show Toast Helper
  const showToast = (message) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ show: true, message });
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 3000);
  };

  // Custom Confirm Trigger
  const triggerConfirm = (message, onConfirm) => {
    setConfirmModal({
      show: true,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal({ show: false, message: '', onConfirm: null });
      }
    });
  };

  // Category counts
  const categoryCounts = {
    All: clothingItems.length,
    Tops: clothingItems.filter(i => i.category === 'Tops').length,
    Bottoms: clothingItems.filter(i => i.category === 'Bottoms').length,
    Outerwear: clothingItems.filter(i => i.category === 'Outerwear').length,
    Shoes: clothingItems.filter(i => i.category === 'Shoes').length
  };

  // Wardrobe value estimation helper
  const totalValueMock = clothingItems.reduce((acc, curr) => {
    const valMap = { Tops: 120, Bottoms: 180, Outerwear: 290, Shoes: 220 };
    return acc + (valMap[curr.category] || 150);
  }, 0);

  // Reset closet back to defaults
  const handleResetCloset = () => {
    triggerConfirm('Reset entire wardrobe collection back to original factory demo items?', () => {
      setClothingItems(INITIAL_CLOSET);
      setSavedOutfits([]);
      showToast('Closet reset back to demo data');
    });
  };

  // Handle image upload and display preview (compressed)
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        showToast('Compressing wardrobe photo...');
        const compressed = await compressImage(file);
        setFormImage(file);
        setFormImagePreview(compressed);
        showToast('Photo optimized successfully');
      } catch (err) {
        console.error("Compression failed, using local URL", err);
        setFormImage(file);
        setFormImagePreview(URL.createObjectURL(file));
      }
    }
  };

  // Handle image upload in Edit form
  const handleEditImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        showToast('Optimizing item photo...');
        const compressed = await compressImage(file);
        setEditFormImagePreview(compressed);
        showToast('Photo optimized successfully');
      } catch (err) {
        console.error("Edit compression failed", err);
        setEditFormImagePreview(URL.createObjectURL(file));
      }
    }
  };

  // Add Item to closet
  const handleAddItem = (e) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    // Use default mock images if no image uploaded
    let finalImage = denimJacketImg;
    if (formImagePreview) {
      finalImage = formImagePreview;
    } else {
      if (formCategory === 'Tops') finalImage = brownSweaterImg;
      else if (formCategory === 'Bottoms') finalImage = blackTrousersImg;
      else if (formCategory === 'Shoes') finalImage = whiteSneakersImg;
    }

    const newItem = {
      id: Date.now().toString(),
      title: formTitle,
      category: formCategory,
      image: finalImage,
      brand: formBrand || 'Unbranded',
      size: formSize || 'N/A',
      color: formColor || 'Multi',
      colorHex: formColorHex,
      tags: formTags ? formTags.split(',').map(t => t.trim()).filter(Boolean) : [],
      notes: formNotes || 'No notes added.'
    };

    setClothingItems([newItem, ...clothingItems]);
    setShowAddModal(false);
    resetForm();
    showToast('Item added to collection');
  };

  const resetForm = () => {
    setFormTitle('');
    setFormCategory('Tops');
    setFormBrand('');
    setFormSize('');
    setFormColor('');
    setFormColorHex('#8C7853');
    setFormTags('');
    setFormNotes('');
    setFormImage(null);
    setFormImagePreview('');
  };

  // Enter edit mode for a piece
  const handleEnterEditMode = (item) => {
    setEditFormTitle(item.title);
    setEditFormBrand(item.brand);
    setEditFormCategory(item.category);
    setEditFormSize(item.size);
    setEditFormColor(item.color);
    setEditFormColorHex(item.colorHex || '#8C7853');
    setEditFormTags(item.tags.join(', '));
    setEditFormNotes(item.notes);
    setEditFormImagePreview(item.image);
    setIsEditingDetail(true);
  };

  // Save changes to edited piece
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editFormTitle.trim()) return;

    const updatedItems = clothingItems.map(item => {
      if (item.id === showDetailModal.id) {
        const updated = {
          ...item,
          title: editFormTitle,
          brand: editFormBrand || 'Unbranded',
          category: editFormCategory,
          size: editFormSize || 'N/A',
          color: editFormColor || 'Multi',
          colorHex: editFormColorHex,
          tags: editFormTags ? editFormTags.split(',').map(t => t.trim()).filter(Boolean) : [],
          notes: editFormNotes || 'No notes added.',
          image: editFormImagePreview
        };
        // Update detail modal active state as well
        setShowDetailModal(updated);
        return updated;
      }
      return item;
    });

    setClothingItems(updatedItems);
    setIsEditingDetail(false);
    showToast('Changes saved to wardrobe');
  };

  // Delete Item from closet
  const handleDeleteItem = (itemId) => {
    triggerConfirm('Are you sure you want to permanently remove this piece from your collection?', () => {
      setClothingItems(clothingItems.filter(item => item.id !== itemId));
      setShowDetailModal(null);
      showToast('Piece removed from collection');
    });
  };

  // Custom Outfit Creation
  const handleSaveOutfit = (e) => {
    e.preventDefault();
    if (!builderName.trim()) {
      showToast('Please name your outfit');
      return;
    }

    const newOutfit = {
      id: Date.now().toString(),
      name: builderName,
      notes: builderNotes || 'No notes added.',
      topsId: selectedBuilderTop?.id || null,
      bottomsId: selectedBuilderBottom?.id || null,
      outerwearId: selectedBuilderOuterwear?.id || null,
      shoesId: selectedBuilderShoes?.id || null,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    setSavedOutfits([newOutfit, ...savedOutfits]);
    setBuilderName('');
    setBuilderNotes('');
    setSelectedBuilderTop(null);
    setSelectedBuilderBottom(null);
    setSelectedBuilderOuterwear(null);
    setSelectedBuilderShoes(null);
    setActiveTab('lookbook');
    showToast('Look saved to Lookbook');
  };

  // Save AI Recommended Outfit
  const handleSaveAIOutfit = () => {
    if (!generatedOutfit) return;
    
    const newOutfit = {
      id: Date.now().toString(),
      name: `AI styling: ${outfitOccasion}`,
      notes: generatedOutfit.description,
      topsId: generatedOutfit.tops?.id || null,
      bottomsId: generatedOutfit.bottoms?.id || null,
      outerwearId: generatedOutfit.outerwear?.id || null,
      shoesId: generatedOutfit.shoes?.id || null,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    setSavedOutfits([newOutfit, ...savedOutfits]);
    showToast('AI Look saved to Lookbook');
  };

  // Delete outfit from lookbook
  const handleDeleteOutfit = (outfitId) => {
    triggerConfirm('Are you sure you want to delete this look from your Lookbook?', () => {
      setSavedOutfits(savedOutfits.filter(o => o.id !== outfitId));
      showToast('Look deleted');
    });
  };


  // Trigger AI Outfit Recommendation (with actual Gemini fallback)
  const handleGenerateOutfit = async (occasion) => {
    setOutfitOccasion(occasion);
    setIsGeneratingOutfit(true);

    const apiKey = import.meta.env.VITE_GEMINI_KEY;
    const isRealKey = apiKey && apiKey !== 'AIzaSyYourActualGeminiAPIKeyHere';

    // Simulate thinking delay for visual satisfaction
    await new Promise(resolve => setTimeout(resolve, 1400));

    if (isRealKey) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const closetDescription = clothingItems.map(i => 
          `- ID: ${i.id}, Title: ${i.title}, Category: ${i.category}, Brand: ${i.brand}, Color: ${i.color}, Tags: ${i.tags.join(', ')}`
        ).join('\n');

        const prompt = `You are a professional fashion stylist. Below is a list of clothing items in a user's digital wardrobe:
${closetDescription}

Create a styled outfit recommendation for the occasion: "${occasion}".
Select exactly one item for each category if possible: Tops, Bottoms, Outerwear, Shoes. Use only items from the wardrobe IDs listed.
Output your response as JSON in the following format:
{
  "topsId": "ID of top",
  "bottomsId": "ID of bottom",
  "outerwearId": "ID of outerwear",
  "shoesId": "ID of shoes",
  "explanation": "Write a 3-sentence styling explanation explaining why this matches the occasion and color palette."
}
Only output the raw JSON. No markdown wrappers.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          
          setGeneratedOutfit({
            tops: clothingItems.find(i => i.id === parsed.topsId) || clothingItems.find(i => i.category === 'Tops'),
            bottoms: clothingItems.find(i => i.id === parsed.bottomsId) || clothingItems.find(i => i.category === 'Bottoms'),
            outerwear: clothingItems.find(i => i.id === parsed.outerwearId) || clothingItems.find(i => i.category === 'Outerwear'),
            shoes: clothingItems.find(i => i.id === parsed.shoesId) || clothingItems.find(i => i.category === 'Shoes'),
            description: parsed.explanation
          });
          setIsGeneratingOutfit(false);
          return;
        }
      } catch (err) {
        console.error("Gemini API call failed, falling back to simulation: ", err);
      }
    }

    // SIMULATED OUTCOMES (Mock data custom-styled to fit the default closet perfectly)
    const topsItem = clothingItems.find(i => i.category === 'Tops') || null;
    const bottomsItem = clothingItems.find(i => i.category === 'Bottoms') || null;
    const outerwearItem = clothingItems.find(i => i.category === 'Outerwear') || null;
    const shoesItem = clothingItems.find(i => i.category === 'Shoes') || null;

    let desc = "";
    if (occasion === 'Casual Sunday') {
      desc = `Ideal for slow weekend pursuits. The ${topsItem?.title || 'knit sweater'} in ${topsItem?.color || 'brown'} grounds the look with seasonal warmth, paired with the structural clean silhouette of the ${bottomsItem?.title || 'trousers'}. Layering the ${outerwearItem?.title || 'denim jacket'} adds casual classic texture, completed by the understated comfort of the ${shoesItem?.title || 'white sneakers'}.`;
    } else if (occasion === 'Date Night') {
      desc = `Elegant and effortless. The fine texture of the ${topsItem?.title || 'cozy sweater'} combined with the slim drape of the ${bottomsItem?.title || 'black trousers'} sets an upscale sartorial tone. The ${outerwearItem?.title || 'denim jacket'} provides a modern casual contrast, finished with the sleek aesthetic of the ${shoesItem?.title || 'leather sneakers'}.`;
    } else if (occasion === 'Job Interview') {
      desc = `Polished professionalism. The crisp form of the ${bottomsItem?.title || 'tailored trousers'} balances perfectly with the ${topsItem?.title || 'knit sweater'} for a modern creative look. Ground the attire with clean, pristine ${shoesItem?.title || 'minimalist sneakers'} to project attention to detail.`;
    } else {
      desc = `A highly balanced everyday ensemble. The color palette blends ${topsItem?.color || 'warm brown'} tones and solid ${bottomsItem?.color || 'black'} lines. Finished with the lightweight ${outerwearItem?.title || 'denim jacket'} and sleek ${shoesItem?.title || 'white sneakers'} for ultimate versatility.`;
    }

    setGeneratedOutfit({
      tops: topsItem,
      bottoms: bottomsItem,
      outerwear: outerwearItem,
      shoes: shoesItem,
      description: desc
    });
    setIsGeneratingOutfit(false);
  };

  // Send message to chatbot (with actual Gemini fallback)
  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: chatInput
    };

    setAdvisorChat(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatting(true);

    const apiKey = import.meta.env.VITE_GEMINI_KEY;
    const isRealKey = apiKey && apiKey !== 'AIzaSyYourActualGeminiAPIKeyHere';

    if (isRealKey) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const closetDescription = clothingItems.map(i => 
          `- Title: ${i.title}, Category: ${i.category}, Brand: ${i.brand}, Color: ${i.color}, Tags: ${i.tags.join(', ')}`
        ).join('\n');

        const prompt = `You are a helpful, stylish digital closet assistant.
Below is the user's current closet inventory:
${closetDescription}

The user asks: "${userMessage.text}"
Give a stylish, encouraging, and clear fashion response. Refer specifically to items in their closet where possible. Keep it under 4 sentences.`;

        const result = await model.generateContent(prompt);
        const botResponse = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: result.response.text().trim()
        };
        setAdvisorChat(prev => [...prev, botResponse]);
        setIsChatting(false);
        return;
      } catch (err) {
        console.error("Gemini chatbot error, falling back to mock: ", err);
      }
    }

    // Simulated Chat Responses based on keyword parsing
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    let replyText = "";
    const query = userMessage.text.toLowerCase();
    
    if (query.includes('blue') || query.includes('denim') || query.includes('jacket')) {
      replyText = "The **Classic Denim Jacket** is an exceptional layering asset. I recommend pairing it with your **Cozy Knit Sweater** in brown to create a rich earth-toned contrast, grounded by your **Tailored Slim Trousers**.";
    } else if (query.includes('sneaker') || query.includes('shoe') || query.includes('white')) {
      replyText = "Your **Minimalist Leather Sneakers** represent a core wardrobe essential. They pair beautifully with the **Tailored Slim Trousers** for a clean, editorial look, or can dial down structured tailoring.";
    } else if (query.includes('formal') || query.includes('work') || query.includes('interview') || query.includes('trousers')) {
      replyText = "For formal or business-casual settings, the **Tailored Slim Trousers** by Theory are your foundational piece. Contrast their sharp shape with the soft, organic knit of the **Cozy Knit Sweater**.";
    } else if (query.includes('sweater') || query.includes('brown') || query.includes('winter') || query.includes('cold')) {
      replyText = "The **Cozy Knit Sweater** by Everlane provides excellent organic texture. Style it with dark trousers and clean sneakers for an effortless smart-casual look suited for transition weather.";
    } else {
      replyText = "That works well. For styling your wardrobe, I recommend contrasting structures: pair the tailored silhouette of your **Tailored Trousers** with the relaxed drape of the **Cozy Knit Sweater** and the weight of the **Denim Jacket**.";
    }

    const botResponse = {
      id: (Date.now() + 1).toString(),
      sender: 'bot',
      text: replyText
    };

    setAdvisorChat(prev => [...prev, botResponse]);
    setIsChatting(false);
  };

  // Filter and search items
  const filteredItems = clothingItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="container animate-fade-in-up">
      {/* Navigation Header */}
      <header className="navbar">
        <div className="logo-container" onClick={handleResetCloset} style={{ cursor: 'pointer' }} title="Reset Wardrobe to default demo items">
          <div className="logo-icon">C</div>
          <div className="logo-text">CLOSET.AI</div>
        </div>
        <nav className="nav-links">
          <button 
            className={`nav-btn ${activeTab === 'closet' ? 'active' : ''}`}
            onClick={() => { setActiveTab('closet'); setIsEditingDetail(false); }}
          >
            Collection
          </button>
          <button 
            className={`nav-btn ${activeTab === 'lookbook' ? 'active' : ''}`}
            onClick={() => { setActiveTab('lookbook'); setIsEditingDetail(false); }}
          >
            Lookbook
          </button>
          <button 
            className={`nav-btn ${activeTab === 'advisor' ? 'active' : ''}`}
            onClick={() => { setActiveTab('advisor'); setIsEditingDetail(false); }}
          >
            Stylist Advisor
          </button>
          <button 
            className={`nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => { setActiveTab('analytics'); setIsEditingDetail(false); }}
          >
            Wardrobe Insights
          </button>
        </nav>
      </header>

      {/* Hero Stats Dashboard */}
      <section className="dashboard-grid">
        <div className="widget">
          <div className="widget-title">01. Wardrobe Size</div>
          <div className="widget-value">{clothingItems.length} Pieces</div>
          <div className="widget-subtext">Active items in catalog</div>
        </div>
        <div className="widget">
          <div className="widget-title">02. Wardrobe Value</div>
          <div className="widget-value">${totalValueMock} USD</div>
          <div className="widget-subtext">Estimated collection worth</div>
        </div>
        <div className="widget rec-widget">
          <div className="rec-header">
            <div className="widget-title">03. Climate & Recommendation</div>
            <div className="weather-badge">72°F / Sunny</div>
          </div>
          <div className="rec-content">
            {clothingItems.length > 0 ? (
              <>
                A beautiful, clear day. We suggest pairing the <strong>{clothingItems.find(i => i.category === 'Outerwear')?.title || 'Classic Layer'}</strong> with your <strong>{clothingItems.find(i => i.category === 'Shoes')?.title || 'Clean Shoes'}</strong> for a comfortable, structured casual look.
              </>
            ) : (
              "Add items to your wardrobe to receive real-time, weather-informed styling recommendations."
            )}
          </div>
        </div>
      </section>

      {/* Main Tab Panel Area */}
      <main className="panel-container">
        
        {/* WARDROBE TAB */}
        {activeTab === 'closet' && (
          <div>
            <div className="toolbar">
              <div className="search-filter-box">
                <div className="search-input-wrapper">
                  <span className="search-icon-svg">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </span>
                  <input 
                    type="text" 
                    placeholder="Search by brand, item, or tags..." 
                    className="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <button className="add-btn" onClick={() => setShowAddModal(true)}>
                <span className="add-btn-icon">+</span>
                <span className="add-btn-text">Add Piece</span>
              </button>
            </div>

            {/* Category selection tabs */}
            <div className="category-pills">
              {Object.keys(categoryCounts).map((cat) => (
                <button 
                  key={cat} 
                  className={`pill ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat} ({categoryCounts[cat]})
                </button>
              ))}
            </div>

            {/* Items Grid */}
            {filteredItems.length === 0 ? (
              <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px' }}>No pieces found</h3>
                <p style={{ marginTop: '8px', fontSize: '13px' }}>Adjust your filters or add a new piece to your collection.</p>
              </div>
            ) : (
              <div className="closet-grid">
                {filteredItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="clothing-card"
                    onClick={() => setShowDetailModal(item)}
                  >
                    <div className="card-img-wrapper">
                      <img src={item.image} alt={item.title} className="card-img" />
                      <span className="card-category-badge">{item.category}</span>
                    </div>
                    <div className="card-info">
                      <div className="card-brand">{item.brand}</div>
                      <h3 className="card-title">{item.title}</h3>
                      <div className="card-tags">
                        {item.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="card-tag">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LOOKBOOK / MY OUTFITS TAB */}
        {activeTab === 'lookbook' && (
          <div>
            <div className="toolbar" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ fontSize: '24px', fontFamily: 'var(--font-serif)', fontWeight: '500' }}>Your Curated Lookbook</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Mix and match pieces to craft bespoke outfits</p>
              </div>
            </div>

            {/* Custom Outfit Builder Section */}
            <div className="builder-layout" style={{ marginBottom: '48px', borderBottom: '1px solid var(--border-color)', paddingBottom: '40px' }}>
              
              {/* Outfit Selection Columns */}
              <div className="builder-selection-section">
                <h3 style={{ fontSize: '18px', fontFamily: 'var(--font-serif)', marginBottom: '8px' }}>Mix & Match Canvas</h3>
                
                {/* Category: Tops */}
                <div className="builder-category-box">
                  <div className="builder-category-title">
                    <span>Tops Selection</span>
                    {selectedBuilderTop && (
                      <span className="builder-category-selected-name">✓ {selectedBuilderTop.title}</span>
                    )}
                  </div>
                  <div className="builder-items-scroll">
                    {clothingItems.filter(i => i.category === 'Tops').map(item => (
                      <div 
                        key={item.id} 
                        className={`builder-item-card ${selectedBuilderTop?.id === item.id ? 'selected' : ''}`}
                        onClick={() => setSelectedBuilderTop(selectedBuilderTop?.id === item.id ? null : item)}
                      >
                        <div className="builder-item-img-box">
                          <img src={item.image} alt="" className="builder-item-img" />
                        </div>
                        <div className="builder-item-title">{item.title}</div>
                      </div>
                    ))}
                    {clothingItems.filter(i => i.category === 'Tops').length === 0 && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No tops available. Add some to get started.</div>
                    )}
                  </div>
                </div>

                {/* Category: Bottoms */}
                <div className="builder-category-box">
                  <div className="builder-category-title">
                    <span>Bottoms Selection</span>
                    {selectedBuilderBottom && (
                      <span className="builder-category-selected-name">✓ {selectedBuilderBottom.title}</span>
                    )}
                  </div>
                  <div className="builder-items-scroll">
                    {clothingItems.filter(i => i.category === 'Bottoms').map(item => (
                      <div 
                        key={item.id} 
                        className={`builder-item-card ${selectedBuilderBottom?.id === item.id ? 'selected' : ''}`}
                        onClick={() => setSelectedBuilderBottom(selectedBuilderBottom?.id === item.id ? null : item)}
                      >
                        <div className="builder-item-img-box">
                          <img src={item.image} alt="" className="builder-item-img" />
                        </div>
                        <div className="builder-item-title">{item.title}</div>
                      </div>
                    ))}
                    {clothingItems.filter(i => i.category === 'Bottoms').length === 0 && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No bottoms available.</div>
                    )}
                  </div>
                </div>

                {/* Category: Outerwear */}
                <div className="builder-category-box">
                  <div className="builder-category-title">
                    <span>Outerwear Selection</span>
                    {selectedBuilderOuterwear && (
                      <span className="builder-category-selected-name">✓ {selectedBuilderOuterwear.title}</span>
                    )}
                  </div>
                  <div className="builder-items-scroll">
                    {clothingItems.filter(i => i.category === 'Outerwear').map(item => (
                      <div 
                        key={item.id} 
                        className={`builder-item-card ${selectedBuilderOuterwear?.id === item.id ? 'selected' : ''}`}
                        onClick={() => setSelectedBuilderOuterwear(selectedBuilderOuterwear?.id === item.id ? null : item)}
                      >
                        <div className="builder-item-img-box">
                          <img src={item.image} alt="" className="builder-item-img" />
                        </div>
                        <div className="builder-item-title">{item.title}</div>
                      </div>
                    ))}
                    {clothingItems.filter(i => i.category === 'Outerwear').length === 0 && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No outerwear available (Optional).</div>
                    )}
                  </div>
                </div>

                {/* Category: Shoes */}
                <div className="builder-category-box">
                  <div className="builder-category-title">
                    <span>Shoes Selection</span>
                    {selectedBuilderShoes && (
                      <span className="builder-category-selected-name">✓ {selectedBuilderShoes.title}</span>
                    )}
                  </div>
                  <div className="builder-items-scroll">
                    {clothingItems.filter(i => i.category === 'Shoes').map(item => (
                      <div 
                        key={item.id} 
                        className={`builder-item-card ${selectedBuilderShoes?.id === item.id ? 'selected' : ''}`}
                        onClick={() => setSelectedBuilderShoes(selectedBuilderShoes?.id === item.id ? null : item)}
                      >
                        <div className="builder-item-img-box">
                          <img src={item.image} alt="" className="builder-item-img" />
                        </div>
                        <div className="builder-item-title">{item.title}</div>
                      </div>
                    ))}
                    {clothingItems.filter(i => i.category === 'Shoes').length === 0 && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No shoes available.</div>
                    )}
                  </div>
                </div>

              </div>

              {/* Outfit Preview and Meta Details Form */}
              <div className="builder-preview-panel">
                <div>
                  <h3 style={{ fontSize: '18px', fontFamily: 'var(--font-serif)', marginBottom: '16px' }}>Curated Preview</h3>
                  
                  {/* Grid layout of selected items */}
                  <div className="outfit-card-grid" style={{ maxWidth: '300px', margin: '0 auto 20px auto' }}>
                    <div className="outfit-card-img-box">
                      {selectedBuilderTop ? (
                        <img src={selectedBuilderTop.image} alt="" className="outfit-card-img" />
                      ) : (
                        <span className="outfit-card-img-placeholder">Top</span>
                      )}
                    </div>
                    <div className="outfit-card-img-box">
                      {selectedBuilderBottom ? (
                        <img src={selectedBuilderBottom.image} alt="" className="outfit-card-img" />
                      ) : (
                        <span className="outfit-card-img-placeholder">Bottom</span>
                      )}
                    </div>
                    <div className="outfit-card-img-box">
                      {selectedBuilderOuterwear ? (
                        <img src={selectedBuilderOuterwear.image} alt="" className="outfit-card-img" />
                      ) : (
                        <span className="outfit-card-img-placeholder">Outerwear</span>
                      )}
                    </div>
                    <div className="outfit-card-img-box">
                      {selectedBuilderShoes ? (
                        <img src={selectedBuilderShoes.image} alt="" className="outfit-card-img" />
                      ) : (
                        <span className="outfit-card-img-placeholder">Shoes</span>
                      )}
                    </div>
                  </div>

                  <form onSubmit={handleSaveOutfit}>
                    <div className="builder-form-group">
                      <label className="form-label">Look Name *</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="e.g. Crisp Autumn Layering" 
                        value={builderName}
                        onChange={(e) => setBuilderName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="builder-form-group">
                      <label className="form-label">Stylist Notes</label>
                      <textarea 
                        className="form-control" 
                        rows="3" 
                        placeholder="Explain style context, weather preferences, or aesthetic keys..." 
                        value={builderNotes}
                        onChange={(e) => setBuilderNotes(e.target.value)}
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="add-btn" 
                      style={{ width: '100%', marginTop: '8px' }}
                      disabled={!selectedBuilderTop && !selectedBuilderBottom && !selectedBuilderOuterwear && !selectedBuilderShoes}
                    >
                      Save Look
                    </button>
                  </form>
                </div>
              </div>

            </div>

            {/* Saved Outfits Gallery */}
            <div>
              <h3 style={{ fontSize: '20px', fontFamily: 'var(--font-serif)', marginBottom: '16px' }}>Saved Outfits ({savedOutfits.length})</h3>
              
              {savedOutfits.length === 0 ? (
                <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)' }}>
                  <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px' }}>Your Lookbook is currently empty</h4>
                  <p style={{ marginTop: '8px', fontSize: '12px' }}>Mix and match components above or save suggestions from the AI Advisor tab.</p>
                </div>
              ) : (
                <div className="lookbook-grid">
                  {savedOutfits.map(outfit => {
                    const topItem = clothingItems.find(i => i.id === outfit.topsId);
                    const bottomItem = clothingItems.find(i => i.id === outfit.bottomsId);
                    const outerwearItem = clothingItems.find(i => i.id === outfit.outerwearId);
                    const shoesItem = clothingItems.find(i => i.id === outfit.shoesId);

                    return (
                      <div key={outfit.id} className="outfit-card">
                        <div className="outfit-card-header">
                          <div>
                            <h4 className="outfit-card-title">{outfit.name}</h4>
                            <div className="outfit-card-date">{outfit.createdAt}</div>
                          </div>
                        </div>

                        <div className="outfit-card-grid">
                          <div className="outfit-card-img-box" title={topItem?.title || 'None'}>
                            {topItem ? <img src={topItem.image} alt="" className="outfit-card-img" /> : <span className="outfit-card-img-placeholder">T</span>}
                          </div>
                          <div className="outfit-card-img-box" title={bottomItem?.title || 'None'}>
                            {bottomItem ? <img src={bottomItem.image} alt="" className="outfit-card-img" /> : <span className="outfit-card-img-placeholder">B</span>}
                          </div>
                          <div className="outfit-card-img-box" title={outerwearItem?.title || 'None'}>
                            {outerwearItem ? <img src={outerwearItem.image} alt="" className="outfit-card-img" /> : <span className="outfit-card-img-placeholder">O</span>}
                          </div>
                          <div className="outfit-card-img-box" title={shoesItem?.title || 'None'}>
                            {shoesItem ? <img src={shoesItem.image} alt="" className="outfit-card-img" /> : <span className="outfit-card-img-placeholder">S</span>}
                          </div>
                        </div>

                        <div className="outfit-card-notes">
                          {outfit.notes}
                        </div>

                        <div className="outfit-card-actions">
                          <button 
                            className="delete-btn" 
                            style={{ margin: 0, padding: '6px 12px', fontSize: '10px' }}
                            onClick={() => handleDeleteOutfit(outfit.id)}
                          >
                            Delete Look
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* AI OUTFIT STYLIST TAB */}
        {activeTab === 'advisor' && (
          <div className="advisor-layout">
            
            {/* Chatbot Column */}
            <div className="chat-console">
              <div className="chat-header">
                <div className="bot-title">Consultation Desk</div>
                <div className="bot-status">Consultant Active</div>
              </div>
              <div className="chat-history">
                {advisorChat.map((msg) => (
                  <div key={msg.id} className={`chat-msg ${msg.sender === 'bot' ? 'bot' : 'user'}`}>
                    {msg.sender === 'bot' && <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.05em', marginBottom: '4px' }}>Recommendation</div>}
                    <p>
                      {msg.text.split('**').map((chunk, i) => i % 2 === 1 ? <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{chunk}</strong> : chunk)}
                    </p>
                  </div>
                ))}
                {isChatting && (
                  <div className="chat-msg bot-thinking">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <form className="chat-input-area" onSubmit={handleSendChatMessage}>
                <input 
                  type="text" 
                  placeholder="Inquire styling advice (e.g. 'How should I pair my denim jacket?')..." 
                  className="chat-textbox"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isChatting}
                />
                <button type="submit" className="send-btn" disabled={isChatting}>
                  →
                </button>
              </form>
            </div>

            {/* Recommended Outfit Generator Panel */}
            <div className="outfit-display-panel">
              <div>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--font-serif)', fontWeight: '500', marginBottom: '16px' }}>Styled Looks</h3>
                <div className="outfit-selection-bar">
                  {['Casual Sunday', 'Date Night', 'Job Interview'].map((occ) => (
                    <button 
                      key={occ}
                      className={`outfit-btn ${outfitOccasion === occ ? 'active' : ''}`}
                      onClick={() => handleGenerateOutfit(occ)}
                      disabled={isGeneratingOutfit}
                    >
                      {occ}
                    </button>
                  ))}
                </div>
              </div>

              {isGeneratingOutfit ? (
                <div style={{ padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <div className="shimmer" style={{ width: '48px', height: '48px', borderRadius: '50%' }}></div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Curating items from wardrobe...</div>
                </div>
              ) : generatedOutfit ? (
                <div className="outfit-output">
                  <div className="outfit-elements-grid">
                    <div className="outfit-piece">
                      <div className="piece-thumbnail-box">
                        <img src={generatedOutfit.tops?.image} alt="" className="piece-thumbnail" />
                      </div>
                      <div className="piece-name">{generatedOutfit.tops?.title || 'None'}</div>
                      <div className="piece-type">Top</div>
                    </div>
                    <div className="outfit-piece">
                      <div className="piece-thumbnail-box">
                        <img src={generatedOutfit.bottoms?.image} alt="" className="piece-thumbnail" />
                      </div>
                      <div className="piece-name">{generatedOutfit.bottoms?.title || 'None'}</div>
                      <div className="piece-type">Bottom</div>
                    </div>
                    <div className="outfit-piece">
                      <div className="piece-thumbnail-box">
                        <img src={generatedOutfit.outerwear?.image} alt="" className="piece-thumbnail" />
                      </div>
                      <div className="piece-name">{generatedOutfit.outerwear?.title || 'None'}</div>
                      <div className="piece-type">Outerwear</div>
                    </div>
                    <div className="outfit-piece">
                      <div className="piece-thumbnail-box">
                        <img src={generatedOutfit.shoes?.image} alt="" className="piece-thumbnail" />
                      </div>
                      <div className="piece-name">{generatedOutfit.shoes?.title || 'None'}</div>
                      <div className="piece-type">Shoes</div>
                    </div>
                  </div>
                  <div className="outfit-description-box">
                    <strong>Stylist Notes</strong>
                    <p style={{ marginBottom: '12px', marginTop: '4px' }}>{generatedOutfit.description}</p>
                    <button className="add-btn" style={{ padding: '8px 14px', fontSize: '11px', textTransform: 'uppercase', width: 'auto', display: 'inline-flex' }} onClick={handleSaveAIOutfit}>
                      + Save Outfit to Lookbook
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '40px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  Select a look above to generate suggestions.
                </div>
              )}
            </div>

          </div>
        )}

        {/* WARDROBE INSIGHTS / ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="analytics-grid">
            
            {/* Category Breakdown Card */}
            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title">Wardrobe Breakdown</h3>
                <p className="chart-subtitle">Composition by Category</p>
              </div>
              <div className="bar-chart-list">
                {Object.keys(categoryCounts).filter(k => k !== 'All').map((cat) => {
                  const count = categoryCounts[cat];
                  const percentage = clothingItems.length ? Math.round((count / clothingItems.length) * 100) : 0;

                  return (
                    <div key={cat} className="chart-bar-item">
                      <div className="bar-label-row">
                        <span>{cat}</span>
                        <span>{count} ({percentage}%)</span>
                      </div>
                      <div className="bar-track">
                        <div 
                          className="bar-fill" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Color Palette Insights */}
            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title">Color Palette</h3>
                <p className="chart-subtitle">Assorted colors in active collection</p>
              </div>
              <div className="color-list-grid">
                {clothingItems.map((item) => (
                  <div key={item.id} className="color-item-spec">
                    <div 
                      className="color-dot" 
                      style={{ 
                        backgroundColor: item.colorHex
                      }} 
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{item.color}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Aesthetic Keywords card */}
            <div className="chart-card" style={{ gridColumn: 'span 2', borderTop: '1px dashed var(--border-color)', paddingTop: '24px', marginTop: '16px' }}>
              <div className="chart-header">
                <h3 className="chart-title">Aesthetic Keywords</h3>
                <p className="chart-subtitle">Most frequent style tags in collection</p>
              </div>
              <div className="popular-tags-list">
                {(() => {
                  const tagCounts = {};
                  clothingItems.forEach(item => {
                    if (item.tags && Array.isArray(item.tags)) {
                      item.tags.forEach(tag => {
                        const cleaned = tag.trim();
                        if (cleaned) {
                          tagCounts[cleaned] = (tagCounts[cleaned] || 0) + 1;
                        }
                      });
                    }
                  });
                  const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);
                  
                  if (sorted.length === 0) {
                    return <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No keywords found. Add hashtags to your pieces.</span>;
                  }

                  return sorted.map(([tag, count]) => (
                    <span key={tag} className="popular-tag-badge">
                      #{tag} <span className="popular-tag-count">({count})</span>
                    </span>
                  ));
                })()}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* DETAIL MODAL */}
      {showDetailModal && (
        <div className="modal-overlay" onClick={() => { setShowDetailModal(null); setIsEditingDetail(false); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => { setShowDetailModal(null); setIsEditingDetail(false); }}>✕</button>
            <div className="modal-left">
              <img src={isEditingDetail ? editFormImagePreview : showDetailModal.image} alt={showDetailModal.title} className="modal-left-img" />
            </div>
            
            {isEditingDetail ? (
              <div className="modal-right">
                <h3 className="form-title" style={{ marginBottom: '16px' }}>Edit Details</h3>
                <form onSubmit={handleSaveEdit}>
                  <div className="form-group">
                    <label className="form-label">Piece Name *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editFormTitle}
                      onChange={(e) => setEditFormTitle(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="form-label">Category *</label>
                      <select 
                        className="form-control"
                        value={editFormCategory}
                        onChange={(e) => setEditFormCategory(e.target.value)}
                      >
                        <option value="Tops">Tops</option>
                        <option value="Bottoms">Bottoms</option>
                        <option value="Outerwear">Outerwear</option>
                        <option value="Shoes">Shoes</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Size</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={editFormSize}
                        onChange={(e) => setEditFormSize(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="form-label">Brand</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={editFormBrand}
                        onChange={(e) => setEditFormBrand(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label">Color</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input 
                          type="color" 
                          className="form-control" 
                          style={{ padding: '0', height: '30px', width: '30px', border: 'none', cursor: 'pointer' }}
                          value={editFormColorHex}
                          onChange={(e) => setEditFormColorHex(e.target.value)}
                        />
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Name"
                          style={{ flexGrow: 1 }}
                          value={editFormColor}
                          onChange={(e) => setEditFormColor(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tags (comma-separated)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editFormTags}
                      onChange={(e) => setEditFormTags(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Styling Notes</label>
                    <textarea 
                      className="form-control" 
                      rows="3" 
                      value={editFormNotes}
                      onChange={(e) => setEditFormNotes(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Piece Photo</label>
                    <input 
                      type="file" 
                      id="edit-file-upload" 
                      accept="image/*" 
                      style={{ display: 'none' }}
                      onChange={handleEditImageChange}
                    />
                    <label htmlFor="edit-file-upload" className="image-upload-area" style={{ padding: '12px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Replace wardrobe photo</span>
                    </label>
                  </div>

                  <div className="action-btn-row">
                    <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsEditingDetail(false)}>Cancel</button>
                    <button type="submit" className="add-btn" style={{ flex: 1.5 }}>Save Changes</button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="modal-right">
                <div>
                  <div className="modal-detail-brand">{showDetailModal.brand}</div>
                  <h2 className="modal-detail-title">{showDetailModal.title}</h2>
                </div>
                
                <div className="modal-specs">
                  <div className="spec-item">
                    <div className="spec-label">Category</div>
                    <div className="spec-value">{showDetailModal.category}</div>
                  </div>
                  <div className="spec-item">
                    <div className="spec-label">Size</div>
                    <div className="spec-value">{showDetailModal.size}</div>
                  </div>
                  <div className="spec-item">
                    <div className="spec-label">Color</div>
                    <div className="spec-value">
                      <span className="spec-color-preview" style={{ backgroundColor: showDetailModal.colorHex }} />
                      {showDetailModal.color}
                    </div>
                  </div>
                  <div className="spec-item">
                    <div className="spec-label">Metadata</div>
                    <div className="spec-value" style={{ fontSize: '13px' }}>{showDetailModal.tags.length} Tags</div>
                  </div>
                </div>

                <div className="modal-section">
                  <div className="modal-section-title">Fit & Details</div>
                  <p className="modal-notes">{showDetailModal.notes}</p>
                </div>

                <div className="modal-section">
                  <div className="modal-section-title">Tags</div>
                  <div className="modal-tags">
                    {showDetailModal.tags.map((tag, idx) => (
                      <span key={idx} className="modal-tag">#{tag}</span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                  <button className="btn-secondary" style={{ flex: 1, padding: '10px 0' }} onClick={() => handleEnterEditMode(showDetailModal)}>
                    Edit Details
                  </button>
                  <button className="delete-btn" style={{ flex: 1, margin: 0, padding: '10px 0' }} onClick={() => handleDeleteItem(showDetailModal.id)}>
                    Remove Piece
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD ITEM MODAL */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="form-modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="form-title">Add Piece</h3>
              <button 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '18px' }}
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddItem}>
              <div className="form-group">
                <label className="form-label">Piece Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Classic Oxford Shirt"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Category *</label>
                  <select 
                    className="form-control"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  >
                    <option value="Tops">Tops</option>
                    <option value="Bottoms">Bottoms</option>
                    <option value="Outerwear">Outerwear</option>
                    <option value="Shoes">Shoes</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Size</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. L, 32, US 10" 
                    value={formSize}
                    onChange={(e) => setFormSize(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Brand</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Ralph Lauren" 
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Color</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input 
                      type="color" 
                      className="form-control" 
                      style={{ padding: '0', height: '30px', width: '30px', border: 'none', cursor: 'pointer' }}
                      value={formColorHex}
                      onChange={(e) => setFormColorHex(e.target.value)}
                    />
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Name"
                      style={{ flexGrow: 1 }}
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tags (comma-separated)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. casual, linen, white"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Styling Notes</label>
                <textarea 
                  className="form-control" 
                  rows="3" 
                  placeholder="Mention fit details or pair pairings..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Piece Photo</label>
                <input 
                  type="file" 
                  id="file-upload" 
                  accept="image/*" 
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />
                <label htmlFor="file-upload" className="image-upload-area">
                  {formImagePreview ? (
                    <img src={formImagePreview} alt="Preview" style={{ width: '100%', maxHeight: '100px', objectFit: 'contain' }} />
                  ) : (
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Choose file or leave empty for default</span>
                    </div>
                  )}
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="add-btn">Add to Wardrobe</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sticky Bottom Navigation for Mobile Devices */}
      <nav className="bottom-nav">
        <button 
          className={`bottom-nav-btn ${activeTab === 'closet' ? 'active' : ''}`}
          onClick={() => { setActiveTab('closet'); setIsEditingDetail(false); }}
        >
          <svg className="bottom-nav-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="9" rx="1"></rect>
            <rect x="14" y="3" width="7" height="5" rx="1"></rect>
            <rect x="14" y="12" width="7" height="9" rx="1"></rect>
            <rect x="3" y="16" width="7" height="5" rx="1"></rect>
          </svg>
          <span>Collection</span>
        </button>
        <button 
          className={`bottom-nav-btn ${activeTab === 'lookbook' ? 'active' : ''}`}
          onClick={() => { setActiveTab('lookbook'); setIsEditingDetail(false); }}
        >
          <svg className="bottom-nav-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
          </svg>
          <span>Lookbook</span>
        </button>
        <button 
          className={`bottom-nav-btn ${activeTab === 'advisor' ? 'active' : ''}`}
          onClick={() => { setActiveTab('advisor'); setIsEditingDetail(false); }}
        >
          <svg className="bottom-nav-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span>Advisor</span>
        </button>
        <button 
          className={`bottom-nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => { setActiveTab('analytics'); setIsEditingDetail(false); }}
        >
          <svg className="bottom-nav-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <span>Insights</span>
        </button>
      </nav>

      {/* Elegant Editorial Toast Notifications */}
      {toast.show && (
        <div className="toast-notification animate-fade-in-up">
          <div className="toast-text">{toast.message}</div>
        </div>
      )}

      {/* Elegant Custom Confirmation Dialog */}
      {confirmModal.show && (
        <div className="modal-overlay" onClick={() => setConfirmModal({ show: false, message: '', onConfirm: null })}>
          <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirm-title">Confirm Action</h3>
            <p className="confirm-message">{confirmModal.message}</p>
            <div className="confirm-actions">
              <button 
                type="button"
                className="btn-secondary" 
                onClick={() => setConfirmModal({ show: false, message: '', onConfirm: null })}
              >
                Cancel
              </button>
              <button 
                type="button"
                className="btn-danger" 
                onClick={confirmModal.onConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
