import { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  Layers, 
  ListTodo, 
  BarChart3, 
  Settings, 
  Mic, 
  MicOff, 
  Volume2, 
  Share2, 
  Plus, 
  Minus,
  Trash2, 
  Edit, 
  AlertTriangle, 
  Download, 
  Search, 
  Sparkles, 
  CheckSquare, 
  PlusCircle,
  Info,
  ShoppingCart,
  TrendingUp,
  ChevronRight,
  Camera
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import confetti from 'canvas-confetti';

// Dynamic API Base URL proxied locally through Vite to prevent HTTPS Mixed Content block issues
const API_BASE = '/api';

const CATEGORIES = ['Grains', 'Oils', 'Sweeteners', 'Dairy', 'Pulses', 'Snacks', 'Personal Care', 'Vegetables', 'Spices', 'Groceries'];
const PACHARI_CATEGORIES = ['Grains', 'Oils', 'Sweeteners', 'Pulses', 'Spices', 'Groceries'];
const FANCY_CATEGORIES = ['Dairy', 'Snacks', 'Personal Care', 'Vegetables'];
const UNITS = ['Kg', 'g', 'L', 'ml', '1L Bottle', 'Packets (1L)', 'Packets', 'Pieces'];

// Pre-seeded common pantry items from the user's handwritten notes
const COMMON_ITEMS = [
  { english_name: 'Toor Dal', telugu_name: 'కందిపప్పు', unit: 'Kg', category: 'Pulses', price: 170, threshold: 2 },
  { english_name: 'Tamarind', telugu_name: 'చింతపండు', unit: 'Kg', category: 'Groceries', price: 200, threshold: 1 },
  { english_name: 'Deeparadhana Oil', telugu_name: 'దీపారాధన నూనె', unit: '1L Bottle', category: 'Oils', price: 150, threshold: 2 },
  { english_name: 'Sugar', telugu_name: 'చక్కెర', unit: 'Kg', category: 'Sweeteners', price: 44, threshold: 2 },
  { english_name: 'Turmeric', telugu_name: 'పసుపు', unit: 'Kg', category: 'Spices', price: 300, threshold: 0.5 },
  { english_name: 'Groundnuts', telugu_name: 'వేరుశనగపప్పులు', unit: 'Kg', category: 'Grains', price: 130, threshold: 2 },
  { english_name: 'Wheat Flour', telugu_name: 'గోధుమ పిండి', unit: 'Kg', category: 'Grains', price: 63, threshold: 2 },
  { english_name: 'Garlic', telugu_name: 'తెల్లగడ్డలు', unit: 'Kg', category: 'Vegetables', price: 210, threshold: 0.5 },
  { english_name: 'Onions', telugu_name: 'ఉల్లిపాయలు', unit: 'Kg', category: 'Vegetables', price: 40, threshold: 2 },
  { english_name: 'Exo Soap', telugu_name: 'ఎక్సో సబ్బు', unit: 'Pieces', category: 'Groceries', price: 30, threshold: 1 },
  { english_name: 'Milk', telugu_name: 'పాలు', unit: 'L', category: 'Dairy', price: 60, threshold: 1 },
  { english_name: 'Curd', telugu_name: 'పెరుగు', unit: 'Packets', category: 'Dairy', price: 30, threshold: 1 },
  { english_name: 'Butter', telugu_name: 'వెన్న', unit: 'Packets', category: 'Dairy', price: 50, threshold: 1 },
  { english_name: 'Ghee', telugu_name: 'నెయ్యి', unit: 'Packets', category: 'Dairy', price: 350, threshold: 1 },
  { english_name: 'Cheese', telugu_name: 'చీజ్', unit: 'Packets', category: 'Dairy', price: 120, threshold: 1 },
  { english_name: 'Mustard', telugu_name: 'ఆవాలు', unit: 'Packets', category: 'Spices', price: 15, threshold: 1 },
  { english_name: 'Cumin', telugu_name: 'జీలకర్ర', unit: 'Packets', category: 'Spices', price: 40, threshold: 1 },
  { english_name: 'Maggi', telugu_name: 'మ్యాగీ', unit: 'Packets', category: 'Snacks', price: 14, threshold: 2 },
  { english_name: 'Horlicks', telugu_name: 'హార్లిక్స్', unit: 'Kg', category: 'Snacks', price: 320, threshold: 0.5 },
  { english_name: 'Colgate Paste', telugu_name: 'కోల్గేట్ పేస్ట్', unit: 'Pieces', category: 'Personal Care', price: 90, threshold: 1 },
  { english_name: 'Salt', telugu_name: 'ఉప్పు', unit: 'Kg', category: 'Spices', price: 25, threshold: 0.5 },
  { english_name: 'Potato', telugu_name: 'బంగాళదుంప', unit: 'Kg', category: 'Vegetables', price: 30, threshold: 2 },
  { english_name: 'Tomato', telugu_name: 'టమాటా', unit: 'Kg', category: 'Vegetables', price: 40, threshold: 2 },
  { english_name: 'Green Chillies', telugu_name: 'పచ్చిమిర్చి', unit: 'Kg', category: 'Vegetables', price: 60, threshold: 0.5 },
  { english_name: 'Coriander', telugu_name: 'కొత్తిమీర', unit: 'Packets', category: 'Vegetables', price: 10, threshold: 1 },
  { english_name: 'Shampoo', telugu_name: 'షాంపూ', unit: 'Pieces', category: 'Personal Care', price: 150, threshold: 1 },
  { english_name: 'Bath Soap', telugu_name: 'స్నానపు సబ్బు', unit: 'Pieces', category: 'Personal Care', price: 45, threshold: 2 },
  { english_name: 'Coconut Oil', telugu_name: 'కొబ్బరి నూనె', unit: 'Pieces', category: 'Personal Care', price: 120, threshold: 1 },
  { english_name: 'Detergent Powder', telugu_name: 'డిటర్జెంట్ పౌడర్', unit: 'Kg', category: 'Personal Care', price: 140, threshold: 1 },
  { english_name: 'Chips', telugu_name: 'చిప్స్', unit: 'Packets', category: 'Snacks', price: 20, threshold: 2 }
];

const isFancyItem = (category: string) => {
  const cat = (category || '').toLowerCase();
  return cat === 'personal care' || cat === 'fancy' || cat === 'cosmetics';
};

const isPachariItem = (item: any) => {
  if (!item) return false;
  const nameLower = (item.english_name || '').toLowerCase();
  const telName = item.telugu_name || '';
  const isNameMatch = nameLower.includes('garlic') || 
                      nameLower.includes('onion') || 
                      telName.includes('ఉల్లిపాయ') || 
                      telName.includes('తెల్లగడ్డ') || 
                      telName.includes('వెల్లుల్లి');
  if (isNameMatch) return true;

  const cat = (item.category || '').toLowerCase();
  return ['grains', 'oils', 'sweeteners', 'pulses', 'spices', 'groceries'].includes(cat);
};

const renderItemName = (item: any, size: 'large' | 'small' = 'large') => {
  const isFancy = isFancyItem(item.category);
  const mainName = isFancy ? item.english_name : (item.telugu_name || item.english_name);
  const subName = isFancy ? (item.telugu_name && item.telugu_name !== item.english_name ? item.telugu_name : '') : (item.telugu_name ? item.english_name : '');

  return (
    <div>
      <h4 className={`${size === 'large' ? 'text-base font-black text-slate-800' : 'font-extrabold text-slate-800'} leading-tight`}>
        {mainName}
      </h4>
      {subName && (
        <h5 className={`${isFancy ? 'text-indigo-600' : 'text-emerald-600'} font-bold text-xs mt-0.5`}>
          {subName}
        </h5>
      )}
    </div>
  );
};


export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [replenishStockTab, setReplenishStockTab] = useState<'pachari' | 'fancy'>('pachari');
  const [replenishPresetTab, setReplenishPresetTab] = useState<'pachari' | 'fancy'>('pachari');
  const [selectedAddItemId, setSelectedAddItemId] = useState<number | ''>('');
  const [addQuantity, setAddQuantity] = useState<number>(1);
  
  const [inventory, setInventory] = useState<any[]>([]);
  const [shoppingList, setShoppingList] = useState<any[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({ monthlyExpenses: [], topItems: [], categoryExpenses: [] });
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [invSearch, setInvSearch] = useState('');
  const [invCategory, setInvCategory] = useState('All');
  
  // Settings
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [fontSize, setFontSize] = useState('normal'); 
  const [speechLanguage, setSpeechLanguage] = useState('te-IN'); 

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  
  // Form states
  const [itemForm, setItemForm] = useState<any>({
    id: null,
    english_name: '',
    telugu_name: '',
    quantity: 0,
    unit: 'Kg',
    threshold: 1,
    category: 'Groceries',
    price: 0
  });
  
  const [purchaseForm, setPurchaseForm] = useState<any>({
    item_id: null,
    english_name: '',
    telugu_name: '',
    quantity: 0,
    unit: 'Kg',
    price_per_unit: 0
  });

  // Voice Assistant State
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [voiceResult, setVoiceResult] = useState<any>(null);
  const [voiceError, setVoiceError] = useState('');
  const recognitionRef = useRef<any>(null);
  const [typedCommand, setTypedCommand] = useState('');
  
  // Item Card specific voice mic state (Enhancement for updating quantities by voice)
  const [activeCardVoiceId, setActiveCardVoiceId] = useState<number | null>(null);

  const [billDate, setBillDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Bill Image scanning state (OCR Receipt analysis)
  const [isScanningBill, setIsScanningBill] = useState(false);
  const [ocrSuccessResult, setOcrSuccessResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notification popups
  const [voiceNotification, setVoiceNotification] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const invRes = await fetch(`${API_BASE}/inventory`);
      const invData = await invRes.json();
      setInventory(invData);

      const shopRes = await fetch(`${API_BASE}/shopping-list`);
      const shopData = await shopRes.json();
      setShoppingList(shopData);

      const historyRes = await fetch(`${API_BASE}/purchase-history`);
      const historyData = await historyRes.json();
      setPurchaseHistory(historyData);

      const analyticsRes = await fetch(`${API_BASE}/analytics`);
      const analyticsData = await analyticsRes.json();
      setAnalytics(analyticsData);

      const recRes = await fetch(`${API_BASE}/recommendations`);
      const recData = await recRes.json();
      setRecommendations(recData);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const speakText = (textTelugu: string, textEnglish: string, forceLang?: string) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel(); 
      const voices = window.speechSynthesis.getVoices();
      
      const activeLang = forceLang || speechLanguage;
      let textToSpeak = textTelugu;
      let speakLang = 'te-IN';
      
      if (activeLang === 'en-US') {
        textToSpeak = textEnglish;
        speakLang = 'en-US';
      }
      
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = speakLang;
      
      if (voices.length > 0) {
        const matchingVoice = voices.find(v => 
          v.lang.toLowerCase() === speakLang.toLowerCase() || 
          v.lang.toLowerCase().startsWith(speakLang.split('-')[0])
        );
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
      }
      
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("SpeechSynthesis error:", e);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.english_name && !itemForm.telugu_name) {
      alert("Please enter either English Name or Telugu Name.");
      return;
    }

    const isEdit = !!itemForm.id;
    const url = isEdit ? `${API_BASE}/inventory/${itemForm.id}` : `${API_BASE}/inventory`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemForm)
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        fetchData();
        confetti({ particleCount: 30, spread: 30 });
      }
    } catch (err) {
      console.error("Error saving item:", err);
    }
  };

  // Fast-Add function for Common Pantry Items panel
  const handleFastAddItem = async (commonItem: any, target: 'stock' | 'list') => {
    try {
      // Check if item already exists in inventory
      let existing = inventory.find(
        i => i.english_name.toLowerCase() === commonItem.english_name.toLowerCase() || 
             (i.telugu_name && i.telugu_name === commonItem.telugu_name)
      );

      if (!existing) {
        // Create the item first in inventory
        const res = await fetch(`${API_BASE}/inventory`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            english_name: commonItem.english_name,
            telugu_name: commonItem.telugu_name,
            quantity: target === 'stock' ? commonItem.threshold * 2 : 0, // add double threshold if stock, 0 if list
            unit: commonItem.unit,
            threshold: commonItem.threshold,
            category: commonItem.category,
            price: commonItem.price
          })
        });
        existing = await res.json();
      }

      if (target === 'stock') {
        // Increment inventory quantity directly
        const replenishQty = commonItem.threshold * 2;
        const res = await fetch(`${API_BASE}/inventory/${existing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity: existing.quantity + replenishQty })
        });
        if (res.ok) {
          fetchData();
          confetti({ particleCount: 30 });
          speakText(`${commonItem.telugu_name} నిల్వను చేర్చాము.`, `Added ${replenishQty} ${commonItem.unit} of ${commonItem.english_name} to Inventory.`);
          showPopupNotification(`Added ${replenishQty} ${commonItem.unit} of ${commonItem.english_name} to Inventory.`);
        }
      } else {
        // Add item to shopping list
        const res = await fetch(`${API_BASE}/shopping-list`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_id: existing.id, quantity: commonItem.threshold * 2 })
        });
        if (res.ok) {
          fetchData();
          confetti({ particleCount: 30 });
          speakText(`${commonItem.telugu_name} ని షాపింగ్ లిస్ట్‌లో చేర్చాము.`, `Added ${commonItem.english_name} to Shopping List.`);
          showPopupNotification(`Added ${commonItem.english_name} to Shopping List.`);
        }
      }
    } catch (err) {
      console.error("Fast add failed:", err);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await fetch(`${API_BASE}/inventory/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  };

  const triggerEdit = (item: any) => {
    setItemForm(item);
    setIsEditModalOpen(true);
  };

  const triggerAdd = () => {
    const defaultCategory = activeTab === 'fancy_pantry' ? 'Personal Care' : 'Groceries';
    setItemForm({
      id: null,
      english_name: '',
      telugu_name: '',
      quantity: 0,
      unit: 'Kg',
      threshold: 1,
      category: defaultCategory,
      price: 0
    });
    setIsAddModalOpen(true);
  };

  const updateQty = async (item: any, delta: number) => {
    const newQty = Math.max(0, item.quantity + delta);
    try {
      const res = await fetch(`${API_BASE}/inventory/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty })
      });
      if (res.ok) {
        fetchData();
        if (newQty < item.threshold) {
          speakText(`${item.telugu_name || item.english_name} నిల్వ తక్కువగా ఉంది. షాపింగ్ లిస్ట్‌కి చేర్చాము.`, `${item.english_name} is running low. Added it to the shopping list.`);
        }
      }
    } catch (err) {
      console.error("Error updating quantity:", err);
    }
  };

  const triggerPurchase = (shopItem: any) => {
    setPurchaseForm({
      item_id: shopItem.item_id,
      english_name: shopItem.english_name,
      telugu_name: shopItem.telugu_name,
      quantity: shopItem.quantity,
      unit: shopItem.unit,
      price_per_unit: shopItem.price || 0
    });
    setIsPurchaseModalOpen(true);
  };

  const handleCompletePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/shopping-list/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchaseForm)
      });
      if (res.ok) {
        setIsPurchaseModalOpen(false);
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
        fetchData();
        speakText(`${purchaseForm.telugu_name || purchaseForm.english_name} కొనుగోలు విజయవంతమైంది.`, `Successfully purchased ${purchaseForm.english_name}.`);
      }
    } catch (err) {
      console.error("Error completing purchase:", err);
    }
  };

  const formatWhatsAppList = () => {
    if (shoppingList.length === 0) return "Shopping list is empty!";
    let text = "🛒 *grocery list / సరుకుల జాబితా*\n\n";
    shoppingList.forEach((item: any, idx: number) => {
      const telNameText = item.telugu_name ? ` (${item.telugu_name})` : '';
      text += `${idx + 1}. □ ${item.english_name}${telNameText} - ${item.quantity} ${item.unit}\n`;
    });
    text += "\n_Generated via Smart Telugu Household Grocery Assistant_";
    return text;
  };

  const shareToWhatsApp = () => {
    const formatted = formatWhatsAppList();
    const url = `https://wa.me/?text=${encodeURIComponent(formatted)}`;
    window.open(url, '_blank');
  };

  const handleReadShoppingList = () => {
    if (shoppingList.length === 0) {
      speakText("మీ షాపింగ్ లిస్ట్ ఖాళీగా ఉంది.", "Your shopping list is empty.");
      return;
    }
    const telNames = shoppingList.map((item: any) => item.telugu_name || item.english_name).join(', ');
    const engNames = shoppingList.map((item: any) => item.english_name).join(', ');
    speakText(`మీ షాపింగ్ లిస్టులో ${telNames} ఉన్నాయి.`, `Your shopping list contains: ${engNames}.`);
  };

  const toggleRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError("Speech recognition is disabled or not supported on this browser/context. Note: Speech recognition requires a secure connection (HTTPS or localhost) and Chrome/Edge browser.");
      showPopupNotification("Speech recognition is not supported in this browser.");
      return;
    }
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError("Speech recognition is disabled or not supported on this browser/context. Note: Speech recognition requires a secure connection (HTTPS or localhost) and Chrome/Edge browser.");
      return;
    }

    setTranscription('');
    setVoiceResult(null);
    setVoiceError('');
    setIsRecording(true);

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = speechLanguage;

    recognition.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscription(text);
      console.log('Transcribed Text:', text);
      await processVoiceCommand(text);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      let errMsg = `Voice Error: ${event.error}`;
      if (event.error === 'not-allowed') {
        errMsg = "Microphone blocked on this network IP. Please use Chrome Flags or Type Command Fallback.";
      }
      setVoiceError(errMsg);
      showPopupNotification(errMsg);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Specific Item Card Voice Microphone handler
  const handleItemVoiceControl = (item: any) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    setActiveCardVoiceId(item.id);
    speakText(`చెప్పండి ${item.telugu_name} ఎంత నిల్వ ఉంది?`, `Please tell me, how much stock is left for ${item.english_name}?`);

    const recognition = new SpeechRecognition();
    recognition.lang = speechLanguage;
    recognition.continuous = false;

    recognition.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;
      console.log(`[Item voice input for ${item.english_name}]:`, text);
      showPopupNotification(`Recieved quantity: "${text}"`);
      
      // Parse quantity from speech
      const lowercaseText = text.toLowerCase().trim();
      let quantity = 1;
      const numMatch = lowercaseText.match(/(\d+(\.\d+)?)/);
      if (numMatch) {
        quantity = parseFloat(numMatch[1]);
      } else {
        if (lowercaseText.includes('రెండు') || lowercaseText.includes('two')) quantity = 2;
        else if (lowercaseText.includes('మూడు') || lowercaseText.includes('three')) quantity = 3;
        else if (lowercaseText.includes('నాలుగు') || lowercaseText.includes('four')) quantity = 4;
        else if (lowercaseText.includes('ఐదు') || lowercaseText.includes('five')) quantity = 5;
        else if (lowercaseText.includes('అయిపోయింది') || lowercaseText.includes('finished') || lowercaseText.includes('empty')) quantity = 0;
      }

      // Execute stock quantity update
      try {
        const res = await fetch(`${API_BASE}/inventory/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity })
        });
        if (res.ok) {
          fetchData();
          confetti({ particleCount: 30 });
          if (quantity === 0) {
            speakText(`${item.telugu_name} అయిపోయింది. షాపింగ్ లిస్ట్‌లో చేర్చాము.`, `${item.english_name} is finished. Added it to the shopping list.`);
          } else {
            speakText(`${item.telugu_name} నిల్వను ${quantity} ${item.unit} కి మార్చాము.`, `Updated ${item.english_name} stock to ${quantity} ${item.unit}.`);
          }
        }
      } catch (err) {
        console.error("Card quantity update failed:", err);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      let errMsg = `Voice Error: ${event.error}`;
      if (event.error === 'not-allowed') {
        errMsg = "Microphone blocked on this network IP. Please use Chrome Flags or Type Command Fallback.";
      }
      setVoiceError(errMsg);
      showPopupNotification(errMsg);
    };

    recognition.onend = () => {
      setActiveCardVoiceId(null);
    };

    recognition.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const processVoiceCommand = async (text: string) => {
    const lowercaseText = text.toLowerCase().trim();

    // 1. Client-Side Voice Navigation Handler
    if (lowercaseText.includes('setting') || lowercaseText.includes('సెట్టింగ్స్')) {
      setActiveTab('settings');
      speakText('ఓపెన్ చేస్తున్నాను సెట్టింగ్స్', 'Opening settings page.');
      showPopupNotification('Switched to Settings / సెట్టింగులు');
      return;
    }
    if (lowercaseText.includes('pachari') || lowercaseText.includes('పచారీ')) {
      setActiveTab('pachari_pantry');
      speakText('ఓపెన్ చేస్తున్నాను పచారీ సరుకులు', 'Opening Pachari Pantry.');
      showPopupNotification('Switched to Pachari Pantry / పచారీ సరుకులు');
      return;
    }
    if (lowercaseText.includes('fancy') || lowercaseText.includes('జనరల్') || lowercaseText.includes('general')) {
      setActiveTab('fancy_pantry');
      speakText('ఓపెన్ చేస్తున్నాను జనరల్ మరియు ఫ్యాన్సీ', 'Opening General & Fancy.');
      showPopupNotification('Switched to General & Fancy / జనరల్ & ఫ్యాన్సీ');
      return;
    }
    if (lowercaseText.includes('inventory') || lowercaseText.includes('నిల్వలు') || lowercaseText.includes('నిల్వ') || lowercaseText.includes('pantry')) {
      setActiveTab('pachari_pantry');
      speakText('ఓపెన్ చేస్తున్నాను పచారీ సరుకులు', 'Opening Pachari Pantry.');
      showPopupNotification('Switched to Pachari Pantry / పచారీ సరుకులు');
      return;
    }
    if (lowercaseText.includes('shopping') || lowercaseText.includes('షాపింగ్') || lowercaseText.includes('లిస్ట్')) {
      setActiveTab('shopping_list');
      speakText('ఓపెన్ చేస్తున్నాను షాపింగ్ లిస్ట్', 'Opening shopping list page.');
      showPopupNotification('Switched to Shopping List / షాపింగ్ లిస్ట్');
      return;
    }
    if (lowercaseText.includes('dashboard') || lowercaseText.includes('హోమ్') || lowercaseText.includes('home')) {
      setActiveTab('dashboard');
      speakText('ఓపెన్ చేస్తున్నాను హోమ్ పేజీ', 'Opening dashboard home page.');
      showPopupNotification('Switched to Dashboard / హోమ్');
      return;
    }
    if (lowercaseText.includes('analytics') || lowercaseText.includes('విశ్లేషణ') || lowercaseText.includes('spending') || lowercaseText.includes('చార్ట్')) {
      setActiveTab('analytics');
      speakText('ఓపెన్ చేస్తున్నాను విశ్లేషణ చార్టులు', 'Opening budget analytics page.');
      showPopupNotification('Switched to Analytics / విశ్లేషణ');
      return;
    }
    if (lowercaseText.includes('replenish') || lowercaseText.includes('త్వరిత') || lowercaseText.includes('నిల్వ భర్తీ') || lowercaseText.includes('quick')) {
      setActiveTab('quick_replenish');
      speakText('ఓపెన్ చేస్తున్నాను త్వరిత నిల్వ', 'Opening Quick Replenish.');
      showPopupNotification('Switched to Quick Replenish / త్వరిత నిల్వ');
      return;
    }
    if (lowercaseText.includes('voice') || lowercaseText.includes('వాయిస్') || lowercaseText.includes('assistant')) {
      setActiveTab('voice_assistant');
      speakText('ఓపెన్ చేస్తున్నాను వాయిస్ కంట్రోల్స్', 'Opening Voice Assistant.');
      showPopupNotification('Switched to Voice Controls / వాయిస్');
      return;
    }

    // 2. Fallback to API Agent processing
    try {
      const res = await fetch(`${API_BASE}/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      setVoiceResult(data);

      if (data.success) {
        confetti({ particleCount: 30, spread: 40 });
        fetchData();
        speakText(data.message_telugu || data.message_english, data.message_english || data.message_telugu);
        const onscreenFeedback = speechLanguage === 'te-IN' ? (data.message_telugu || data.message_english) : (data.message_english || data.message_telugu);
        showPopupNotification(onscreenFeedback);
      } else {
        setVoiceError(data.message_english || data.error || "Error executing command.");
      }
    } catch (err) {
      console.error("Voice processing failed:", err);
      setVoiceError("Connection to coordinator agent failed. Using offline backup.");
    }
  };

  const showPopupNotification = (msg: string) => {
    setVoiceNotification(msg);
    setTimeout(() => {
      setVoiceNotification(null);
    }, 4500);
  };

  // OCR Receipt Image Scanner Handler
  const handleBillScanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningBill(true);
    setOcrSuccessResult(null);
    speakText("బిల్లును స్కాన్ చేస్తున్నాను. దయచేసి వేచి ఉండండి.", "Scanning bill receipt. Please wait.");

    const reader = new FileReader();
    reader.onload = async () => {
      const base64String = reader.result as string;
      try {
        const res = await fetch(`${API_BASE}/agent/scan-bill`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64String,
            mimeType: file.type,
            billDate: billDate
          })
        });
        const data = await res.json();
        setIsScanningBill(false);

        if (data.success) {
          confetti({ particleCount: 100, spread: 60 });
          setOcrSuccessResult(data.items);
          fetchData();
          speakText(data.message_telugu, data.message_english);
          showPopupNotification(data.message_english);
        } else {
          alert(`OCR Scan Failed: ${data.message_english}`);
        }
      } catch (err) {
        console.error("OCR API failed:", err);
        setIsScanningBill(false);
        alert("Receipt Scanning failed. Check connection to Express backend.");
      }
    };
    reader.readAsDataURL(file);
  };

  const downloadReport = (format: string) => {
    const today = new Date();
    const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    window.open(`${API_BASE}/reports/download?month=${monthStr}&format=${format}`);
  };

  const downloadShoppingListPDF = () => {
    window.open(`${API_BASE}/reports/shopping-list/download`);
  };

  const handleAddCustomToShoppingList = async () => {
    if (!selectedAddItemId) {
      alert("Please select an item first.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/shopping-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: selectedAddItemId, quantity: addQuantity })
      });
      if (res.ok) {
        fetchData();
        setSelectedAddItemId('');
        setAddQuantity(1);
        confetti({ particleCount: 30 });
        showPopupNotification("Item added to shopping list.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateShoppingListQty = async (item: any, delta: number) => {
    const newQty = Math.max(1, item.quantity + delta);
    try {
      const res = await fetch(`${API_BASE}/shopping-list/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateShoppingListQtyValue = async (id: number, val: number) => {
    const newQty = Math.max(0.1, val);
    try {
      const res = await fetch(`${API_BASE}/shopping-list/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteFromShoppingList = async (id: number) => {
    if (!confirm("Remove this item from the shopping list?")) return;
    try {
      const res = await fetch(`${API_BASE}/shopping-list/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchData();
        showPopupNotification("Removed from shopping list.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredInventory = inventory.filter((item: any) => {
    const matchSearch = item.english_name.toLowerCase().includes(invSearch.toLowerCase()) || 
                        (item.telugu_name && item.telugu_name.includes(invSearch));
    const matchCategory = invCategory === 'All' || item.category === invCategory;
    return matchSearch && matchCategory;
  });

  const filteredPachariInventory = filteredInventory.filter((item: any) => isPachariItem(item));
  const filteredFancyInventory = filteredInventory.filter((item: any) => !isPachariItem(item));

  const pachariShoppingList = shoppingList.filter((item: any) => isPachariItem(item));
  const fancyShoppingList = shoppingList.filter((item: any) => !isPachariItem(item));

  const lowStockCount = inventory.filter((item: any) => item.quantity < item.threshold).length;
  const totalCostEstimate = inventory.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);

  const getStockStatus = (quantity: number, threshold: number) => {
    if (quantity === 0) {
      return { 
        percent: 0, 
        color: 'bg-rose-500', 
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-100', 
        labelEnglish: 'Finished', 
        labelTelugu: 'ఖాలీ అయింది' 
      };
    }
    
    if (quantity < threshold) {
      const percent = Math.min(100, Math.round((quantity / threshold) * 100));
      return { 
        percent, 
        color: 'bg-rose-500', 
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-100', 
        labelEnglish: 'Running Low', 
        labelTelugu: 'తక్కువగా ఉంది' 
      };
    }
    
    const healthyLevel = threshold * 2;
    if (quantity >= threshold && quantity < healthyLevel) {
      const percent = Math.min(100, Math.round((quantity / healthyLevel) * 100));
      return { 
        percent, 
        color: 'bg-amber-500', 
        bg: 'bg-amber-50', 
        text: 'text-amber-700',
        border: 'border-amber-100',
        labelEnglish: 'Moderate', 
        labelTelugu: 'పర్వాలేదు' 
      };
    }
    
    const percent = 100;
    return { 
      percent, 
      color: 'bg-emerald-500', 
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-100',
      labelEnglish: 'Sufficient', 
      labelTelugu: 'సమృద్ధిగా ఉంది' 
    };
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row bg-[#F7F9FC] text-slate-800 font-sans ${fontSize === 'large' ? 'text-lg font-medium' : 'text-sm'}`}>
      
      {/* Sidebar Navigation - Sleek Premium Navy */}
      <aside className="w-full md:w-72 bg-[#0B132B] text-white flex flex-col justify-between shrink-0 shadow-2xl relative z-10">
        <div>
          <div className="p-6 flex items-center space-x-3.5 bg-[#070C1E] border-b border-slate-800/60">
            <div className="p-3 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
              <ShoppingCart className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="font-black text-lg tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">SMART PANTRY</h1>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">స్మార్ట్ కుటుంబ సహాయకం</p>
            </div>
          </div>
          
          <nav className="p-5 space-y-2">
            {[
              { id: 'dashboard', name: 'Dashboard / హోమ్', icon: Home },
              { id: 'pachari_pantry', name: 'Pachari Pantry / పచారీ సరుకులు', icon: Layers, count: inventory.filter((item: any) => isPachariItem(item) && item.quantity < item.threshold).length },
              { id: 'fancy_pantry', name: 'General & Fancy / జనరల్ & ఫ్యాన్సీ', icon: Sparkles, count: inventory.filter((item: any) => !isPachariItem(item) && item.quantity < item.threshold).length },
              { id: 'shopping_list', name: 'Shopping List / సరుకులు', icon: ListTodo, count: shoppingList.length },
              { id: 'quick_replenish', name: 'Quick Replenish / త్వరిత నిల్వ', icon: CheckSquare, count: inventory.filter((item: any) => item.quantity === 0).length },
              { id: 'voice_assistant', name: 'Voice Controls / వాయిస్', icon: Mic },
              { id: 'analytics', name: 'Analytics / బడ్జెట్', icon: BarChart3 },
              { id: 'settings', name: 'Settings / సెట్టింగ్స్', icon: Settings },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setInvCategory('All');
                    setInvSearch('');
                  }}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all duration-200 group font-bold tracking-wide ${
                    isActive 
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/20 translate-x-1' 
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-emerald-400'}`} />
                    <span className={fontSize === 'large' ? 'text-lg' : 'text-sm'}>{tab.name}</span>
                  </div>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="bg-rose-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full ring-2 ring-[#0B132B] animate-bounce">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-5 bg-[#070C1E]/60 border-t border-slate-800/40 text-center">
          <p className="text-[11px] text-slate-400 font-semibold">Bilingual Telugu & English Assistant</p>
          <div className="flex items-center justify-center space-x-2 mt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-[9px] text-emerald-400/80 font-mono tracking-widest uppercase font-bold">Network Host Enabled</span>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Top Header */}
        <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 py-4 px-6 md:px-8 flex items-center justify-between z-30">
          <div className="flex items-center space-x-4 flex-1 max-w-md mr-4">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 shrink-0">
              {activeTab}
            </span>
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const inputElement = (form.elements.namedItem('headerCmd') as HTMLInputElement);
                const cmd = inputElement?.value || '';
                if (!cmd.trim()) return;
                setTranscription(cmd);
                inputElement.value = '';
                await processVoiceCommand(cmd);
              }}
              className="hidden sm:flex items-center bg-slate-50 border border-slate-150 rounded-2xl px-3.5 py-2 w-full focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500/50 focus-within:bg-white transition-all"
            >
              <Search className="w-4.5 h-4.5 text-slate-400 shrink-0" />
              <input 
                name="headerCmd"
                type="text" 
                placeholder="Ask AI / టైప్ చేయండి (e.g. Rice 5kg, open settings)..." 
                className="bg-transparent border-none focus:outline-none text-xs font-semibold text-slate-700 w-full ml-2"
              />
            </form>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className={`p-2 rounded-xl border transition flex items-center space-x-1.5 text-xs font-bold ${
                ttsEnabled 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100' 
                  : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>{ttsEnabled ? "TTS On" : "Muted"}</span>
            </button>
            
            <button 
              onClick={toggleRecording}
              className={`p-2 rounded-xl border transition flex items-center space-x-1.5 text-xs font-bold ${
                isRecording 
                  ? 'bg-rose-50 border-rose-100 text-rose-700 animate-pulse' 
                  : 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isRecording ? "Listening..." : "Talk"}</span>
            </button>
          </div>
        </header>

        {/* Global Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] z-50 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-2xl flex flex-col items-center space-y-3 border border-slate-100/50">
              <div className="w-10 h-10 border-[3px] border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-600 font-bold text-xs">డేటా అప్‌డేట్ అవుతోంది...</p>
            </div>
          </div>
        )}

        {/* Floating Voice Assistant Notification Panel */}
        {voiceNotification && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 z-50 animate-slideUp border border-slate-800/80">
            <div className="p-1.5 bg-emerald-500 rounded-lg text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-300">Feedback</p>
              <p className="text-sm font-bold text-white mt-0.5">{voiceNotification}</p>
            </div>
          </div>
        )}

        {/* Content Body */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">

          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Premium Hero Banner */}
              <div className="bg-gradient-to-r from-[#0F2027] via-[#203A43] to-[#2C5364] text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800 relative overflow-hidden">
                <div className="space-y-1.5 relative z-10">
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">నమస్కారం! Welcome</h2>
                  <p className="text-slate-300 font-medium text-sm md:text-base">AI grocery coordinator is active. Scan bills to update spending analytics.</p>
                </div>
                
                {/* Image OCR receipt Scanner trigger */}
                <div className="flex items-center space-x-2.5 relative z-10">
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    ref={fileInputRef} 
                    onChange={handleBillScanUpload} 
                    className="hidden" 
                  />
                  <div className="flex flex-col space-y-1">
                    <label className="text-[9px] text-emerald-300 font-black tracking-wider uppercase ml-1">Bill Date / తేదీ</label>
                    <input 
                      type="date" 
                      value={billDate} 
                      onChange={(e) => setBillDate(e.target.value)} 
                      className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-4 py-3 rounded-2xl text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                    />
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isScanningBill}
                    className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-3.5 rounded-2xl font-black transition shadow-lg shadow-emerald-600/30 text-xs disabled:opacity-50 self-end"
                  >
                    {isScanningBill ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                    <span>{isScanningBill ? "Scanning..." : "Scan Bill (OCR)"}</span>
                  </button>

                  <button 
                    onClick={() => downloadReport('pdf')}
                    className="flex items-center space-x-2 bg-white/10 backdrop-blur-md text-white border border-white/20 px-5 py-3.5 rounded-2xl hover:bg-white/20 transition shadow-sm font-extrabold text-xs self-end"
                  >
                    <Download className="w-4 h-4 text-rose-400" />
                    <span>PDF</span>
                  </button>
                </div>
                <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none translate-x-20 -translate-y-20"></div>
              </div>

              {/* OCR Scan success confirmation notification banner */}
              {ocrSuccessResult && (
                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-3xl space-y-3 shadow-md animate-slideUp">
                  <div className="flex justify-between items-center">
                    <h4 className="font-black text-emerald-800 text-base flex items-center space-x-2">
                      <CheckSquare className="w-5 h-5 text-emerald-600" />
                      <span>Successfully Imported Bill Details!</span>
                    </h4>
                    <button onClick={() => setOcrSuccessResult(null)} className="text-slate-400 hover:text-slate-600 font-bold text-xs">Dismiss</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {ocrSuccessResult.map((t: any, idx: number) => (
                      <div key={idx} className="bg-white p-3 rounded-2xl border border-slate-100 text-slate-800">
                        <p className="font-extrabold text-sm truncate">{t.english_name}</p>
                        <p className="text-[10px] text-emerald-600 font-bold">{t.telugu_name}</p>
                        <p className="text-xs font-black mt-1.5 text-slate-600">{t.quantity} {t.unit} = Rs. {t.total_price}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grid metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Total Stocked Items', sub: 'మొత్తం సరుకులు', val: inventory.length, icon: Layers, bg: 'bg-blue-500/5' },
                  { label: 'Running Out / Finished', sub: 'కొరత ఉన్న సరుకులు', val: lowStockCount, icon: AlertTriangle, bg: 'bg-rose-500/5' },
                  { label: 'Monthly Stock Valuation', sub: 'మొత్తం విలువ', val: `Rs. ${totalCostEstimate.toFixed(2)}`, icon: TrendingUp, bg: 'bg-emerald-500/5' }
                ].map((m, i) => {
                  const Icon = m.icon;
                  return (
                    <div key={i} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">{m.label}</p>
                        <p className="text-slate-500 text-xs font-semibold">{m.sub}</p>
                        <h3 className="text-3xl font-black text-slate-800 mt-2">{m.val}</h3>
                      </div>
                      <div className={`p-4 rounded-2xl ${m.bg} bg-opacity-20`}>
                        <Icon className="w-8 h-8 text-slate-700" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* AI Recommendation Banner */}
              {recommendations.length > 0 && (
                <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white p-6 rounded-3xl shadow-xl flex items-center justify-between relative overflow-hidden border border-emerald-400/10">
                  <div className="space-y-1 z-10">
                    <div className="flex items-center space-x-2">
                      <div className="bg-white/20 p-1 rounded-lg">
                        <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" />
                      </div>
                      <span className="font-extrabold text-[10px] tracking-widest uppercase text-yellow-200">Recommendation / సలహా</span>
                    </div>
                    <h4 className="text-lg md:text-xl font-black leading-snug">
                      Need to purchase {recommendations[0].englishName} ({recommendations[0].teluguName})?
                    </h4>
                    <p className="text-emerald-50 text-xs">
                      {recommendations[0].reason_english} / {recommendations[0].reason_telugu}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      fetch(`${API_BASE}/shopping-list`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ item_id: recommendations[0].itemId, quantity: recommendations[0].suggestedQuantity })
                      }).then(() => {
                        fetchData();
                        confetti({ particleCount: 30 });
                        showPopupNotification(`Added suggestion for ${recommendations[0].englishName}`);
                      });
                    }}
                    className="bg-white text-emerald-800 hover:bg-emerald-50 font-black px-5 py-3 rounded-2xl transition shadow-lg shrink-0 z-10 text-xs"
                  >
                    Add {recommendations[0].suggestedQuantity} {recommendations[0].unit}
                  </button>
                  <div className="absolute right-0 bottom-0 opacity-5 translate-x-12 translate-y-12">
                    <Sparkles className="w-64 h-64" />
                  </div>
                </div>
              )}

              {/* Running low & Quick shopping list */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="text-lg font-black text-slate-800 flex items-center space-x-2">
                      <AlertTriangle className="text-rose-500 w-5 h-5" />
                      <span>Low Stock Items / నిల్వ అయిపోతున్నవి</span>
                    </h4>
                    <p className="text-slate-400 text-xs mt-1">Groceries that are currently below threshold level.</p>
                    
                    <div className="mt-4 space-y-3">
                      {inventory.filter((item: any) => item.quantity < item.threshold).length === 0 ? (
                        <div className="text-center py-12 text-slate-300 font-bold">
                          ✨ All items are sufficiently stocked!
                        </div>
                      ) : (
                        inventory
                          .filter((item: any) => item.quantity < item.threshold)
                          .slice(0, 4)
                          .map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between p-3.5 bg-rose-50/20 hover:bg-rose-50/50 rounded-2xl border border-rose-100/30 transition">
                              <div>
                                {renderItemName(item, 'small')}
                                <p className="text-xs text-rose-500 font-bold mt-0.5">
                                  Current: {item.quantity} {item.unit} (Threshold: {item.threshold} {item.unit})
                                </p>
                              </div>
                              <button 
                                onClick={() => updateQty(item, 1)}
                                className="bg-white text-rose-600 border border-rose-100 p-2 rounded-xl hover:bg-rose-50 shadow-sm transition"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                  
                  {lowStockCount > 4 && (
                    <button 
                      onClick={() => setActiveTab('pachari_pantry')}
                      className="w-full text-center text-rose-600 font-bold text-xs hover:underline mt-4 pt-2 border-t border-slate-50"
                    >
                      View all {lowStockCount} items
                    </button>
                  )}
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-black text-slate-800 flex items-center space-x-2">
                        <ListTodo className="text-emerald-500 w-5 h-5" />
                        <span>Shopping List / కొనుగోలు పట్టిక</span>
                      </h4>
                      <button 
                        onClick={handleReadShoppingList}
                        className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition"
                        title="Read Shopping List out loud"
                      >
                        <Volume2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                    <p className="text-slate-400 text-xs mt-1">Groceries marked for purchase.</p>
                    
                    <div className="mt-4 space-y-3">
                      {shoppingList.length === 0 ? (
                        <div className="text-center py-12 text-slate-300 font-bold">
                          📝 Shopping list is currently empty.
                        </div>
                      ) : (
                        shoppingList.slice(0, 4).map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/50 rounded-2xl border border-slate-100/60 transition">
                            <div>
                              {renderItemName(item, 'small')}
                              <p className="text-xs text-slate-500 font-bold mt-0.5">Needed: {item.quantity} {item.unit}</p>
                            </div>
                            <button
                              onClick={() => triggerPurchase(item)}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs transition shadow-sm"
                            >
                              Purchased
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {shoppingList.length > 4 && (
                    <button 
                      onClick={() => setActiveTab('shopping_list')}
                      className="w-full text-center text-emerald-600 font-bold text-xs hover:underline mt-4 pt-2 border-t border-slate-50"
                    >
                      View complete list ({shoppingList.length} items)
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PACHARI PANTRY TAB */}
          {activeTab === 'pachari_pantry' && (
            <div className="flex flex-col lg:flex-row gap-6 animate-fadeIn">
              
              {/* Main inventory display area */}
              <div className="flex-1 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800">Pachari Pantry / పచారీ సరుకులు</h2>
                    <p className="text-slate-500 mt-1">Grains, pulses, oils, spices, sweeteners, and dry provisions.</p>
                  </div>
                  
                  <div className="flex items-center space-x-2.5">
                    <button 
                      onClick={toggleRecording}
                      className={`flex items-center space-x-2 font-bold px-4 py-3 rounded-2xl border transition shadow-sm ${
                        isRecording 
                          ? 'bg-rose-50 border-rose-200 text-rose-700' 
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {isRecording ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5 text-emerald-500" />}
                      <span>{isRecording ? "Listening..." : "Voice Stock Update"}</span>
                    </button>

                    <button 
                      onClick={triggerAdd}
                      className="flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black px-5 py-3 rounded-2xl hover:opacity-95 transition shadow-md shadow-emerald-500/10 text-xs"
                    >
                      <PlusCircle className="w-5 h-5" />
                      <span>Add Item / సరుకు చేర్చు</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                      type="text" 
                      value={invSearch}
                      onChange={(e) => setInvSearch(e.target.value)}
                      placeholder="Search name (English or తెలుగు)..."
                      className="w-full pl-12 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 bg-slate-50 focus:bg-white text-xs font-semibold"
                    />
                  </div>

                  <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto py-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Category:</span>
                    {['All', ...PACHARI_CATEGORIES].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setInvCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                          invCategory === cat 
                            ? 'bg-[#0B132B] text-white' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stock Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredPachariInventory.length === 0 ? (
                    <div className="col-span-full text-center py-16 text-slate-400 bg-white border border-slate-100 rounded-3xl">
                      <Info className="w-12 h-12 mx-auto text-slate-300" />
                      <p className="mt-4 font-extrabold text-slate-500">No items found matching the filters.</p>
                    </div>
                  ) : (
                    filteredPachariInventory.map((item: any) => {
                      const status = getStockStatus(item.quantity, item.threshold);
                      const isListeningThisCard = activeCardVoiceId === item.id;
                      return (
                        <div 
                          key={item.id} 
                          className={`bg-white rounded-3xl border p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between ${
                            item.quantity < item.threshold ? 'border-rose-200 bg-rose-50/5' : 'border-slate-100'
                          } ${isListeningThisCard ? 'ring-4 ring-rose-500/30 border-rose-400' : ''}`}
                        >
                          <div>
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                                  {item.category}
                                </span>
                                <div className="mt-2.5">
                                  {renderItemName(item, 'large')}
                                </div>
                              </div>
                              
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${status.bg} ${status.text} ${status.border}`}>
                                {status.labelTelugu}
                              </span>
                            </div>

                            <div className="my-4 flex items-baseline space-x-1.5">
                              <span className="text-3xl font-black text-slate-900">{item.quantity}</span>
                              <span className="text-slate-500 font-extrabold text-sm">{item.unit}</span>
                              <span className="text-[10px] text-slate-400 font-bold ml-2">
                                (Min: {item.threshold} {item.unit})
                              </span>
                            </div>

                            {/* Stock Indicator Progress bar */}
                            <div className="space-y-1.5 mb-5">
                              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                <span>Stock level</span>
                                <span>{status.percent}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${status.color}`}
                                  style={{ width: `${status.percent}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100/60 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {/* Direct Card voice controls */}
                              <button
                                type="button"
                                onClick={() => handleItemVoiceControl(item)}
                                className={`p-2 rounded-xl border transition shadow-sm ${
                                  isListeningThisCard 
                                    ? 'bg-rose-500 text-white animate-pulse border-rose-500' 
                                    : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-100 text-emerald-700'
                                }`}
                                title="Click to speak quantity directly for this item"
                              >
                                <Mic className="w-4 h-4" />
                              </button>

                              <button 
                                onClick={() => updateQty(item, -1)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-xl transition"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => updateQty(item, 1)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-xl transition"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex items-center space-x-1">
                              <button 
                                onClick={() => triggerEdit(item)}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Side Fast-Add Panel */}
              <div className="w-full lg:w-80 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 shrink-0">
                <div>
                  <h3 className="text-base font-black text-slate-800 flex items-center space-x-2">
                    <Sparkles className="w-4.5 h-4.5 text-emerald-500" />
                    <span>Quick-Add Pachari</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Quickly restock common grains, pulses, oils, spices, and sweeteners.</p>
                </div>
                
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {COMMON_ITEMS.filter(item => isPachariItem(item)).map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50 flex flex-col justify-between hover:bg-slate-100/20 transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-extrabold text-xs text-slate-800">{item.english_name}</p>
                          <p className="text-[10px] text-emerald-600 font-bold">{item.telugu_name}</p>
                        </div>
                        <span className="text-[9px] font-black text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">{item.unit}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-100">
                        <button
                          onClick={() => handleFastAddItem(item, 'stock')}
                          className="bg-white border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 text-slate-700 hover:text-emerald-700 text-[10px] font-bold py-1.5 rounded-xl transition"
                        >
                          + Stock / నిల్వ
                        </button>
                        <button
                          onClick={() => handleFastAddItem(item, 'list')}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold py-1.5 rounded-xl transition"
                        >
                          + List / లిస్ట్
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* GENERAL & FANCY PANTRY TAB */}
          {activeTab === 'fancy_pantry' && (
            <div className="flex flex-col lg:flex-row gap-6 animate-fadeIn">
              
              {/* Main inventory display area */}
              <div className="flex-1 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800">General & Fancy / జనరల్ & ఫ్యాన్సీ</h2>
                    <p className="text-slate-500 mt-1">Soaps, personal care, dairy, snacks, and fresh vegetables.</p>
                  </div>
                  
                  <div className="flex items-center space-x-2.5">
                    <button 
                      onClick={toggleRecording}
                      className={`flex items-center space-x-2 font-bold px-4 py-3 rounded-2xl border transition shadow-sm ${
                        isRecording 
                          ? 'bg-rose-50 border-rose-200 text-rose-700' 
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {isRecording ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5 text-emerald-500" />}
                      <span>{isRecording ? "Listening..." : "Voice Stock Update"}</span>
                    </button>

                    <button 
                      onClick={triggerAdd}
                      className="flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black px-5 py-3 rounded-2xl hover:opacity-95 transition shadow-md shadow-emerald-500/10 text-xs"
                    >
                      <PlusCircle className="w-5 h-5" />
                      <span>Add Item / సరుకు చేర్చు</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                      type="text" 
                      value={invSearch}
                      onChange={(e) => setInvSearch(e.target.value)}
                      placeholder="Search name (English or తెలుగు)..."
                      className="w-full pl-12 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 bg-slate-50 focus:bg-white text-xs font-semibold"
                    />
                  </div>

                  <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto py-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Category:</span>
                    {['All', ...FANCY_CATEGORIES].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setInvCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                          invCategory === cat 
                            ? 'bg-[#0B132B] text-white' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stock Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredFancyInventory.length === 0 ? (
                    <div className="col-span-full text-center py-16 text-slate-400 bg-white border border-slate-100 rounded-3xl">
                      <Info className="w-12 h-12 mx-auto text-slate-300" />
                      <p className="mt-4 font-extrabold text-slate-500">No items found matching the filters.</p>
                    </div>
                  ) : (
                    filteredFancyInventory.map((item: any) => {
                      const status = getStockStatus(item.quantity, item.threshold);
                      const isListeningThisCard = activeCardVoiceId === item.id;
                      return (
                        <div 
                          key={item.id} 
                          className={`bg-white rounded-3xl border p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between ${
                            item.quantity < item.threshold ? 'border-rose-200 bg-rose-50/5' : 'border-slate-100'
                          } ${isListeningThisCard ? 'ring-4 ring-rose-500/30 border-rose-400' : ''}`}
                        >
                          <div>
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                                  {item.category}
                                </span>
                                <div className="mt-2.5">
                                  {renderItemName(item, 'large')}
                                </div>
                              </div>
                              
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${status.bg} ${status.text} ${status.border}`}>
                                {status.labelTelugu}
                              </span>
                            </div>

                            <div className="my-4 flex items-baseline space-x-1.5">
                              <span className="text-3xl font-black text-slate-900">{item.quantity}</span>
                              <span className="text-slate-500 font-extrabold text-sm">{item.unit}</span>
                              <span className="text-[10px] text-slate-400 font-bold ml-2">
                                (Min: {item.threshold} {item.unit})
                              </span>
                            </div>

                            {/* Stock Indicator Progress bar */}
                            <div className="space-y-1.5 mb-5">
                              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                <span>Stock level</span>
                                <span>{status.percent}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${status.color}`}
                                  style={{ width: `${status.percent}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100/60 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {/* Direct Card voice controls */}
                              <button
                                type="button"
                                onClick={() => handleItemVoiceControl(item)}
                                className={`p-2 rounded-xl border transition shadow-sm ${
                                  isListeningThisCard 
                                    ? 'bg-rose-500 text-white animate-pulse border-rose-500' 
                                    : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-100 text-emerald-700'
                                }`}
                                title="Click to speak quantity directly for this item"
                              >
                                <Mic className="w-4 h-4" />
                              </button>

                              <button 
                                onClick={() => updateQty(item, -1)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-xl transition"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => updateQty(item, 1)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-xl transition"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex items-center space-x-1">
                              <button 
                                onClick={() => triggerEdit(item)}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Side Fast-Add Panel */}
              <div className="w-full lg:w-80 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 shrink-0">
                <div>
                  <h3 className="text-base font-black text-slate-800 flex items-center space-x-2">
                    <Sparkles className="w-4.5 h-4.5 text-emerald-500" />
                    <span>Quick-Add Fancy</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Quickly restock personal care items, dairy, snacks, and vegetables.</p>
                </div>
                
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {COMMON_ITEMS.filter(item => !isPachariItem(item)).map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50 flex flex-col justify-between hover:bg-slate-100/20 transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-extrabold text-xs text-slate-800">{item.english_name}</p>
                          <p className="text-[10px] text-emerald-600 font-bold">{item.telugu_name}</p>
                        </div>
                        <span className="text-[9px] font-black text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">{item.unit}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-100">
                        <button
                          onClick={() => handleFastAddItem(item, 'stock')}
                          className="bg-white border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 text-slate-700 hover:text-emerald-700 text-[10px] font-bold py-1.5 rounded-xl transition"
                        >
                          + Stock / నిల్వ
                        </button>
                        <button
                          onClick={() => handleFastAddItem(item, 'list')}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold py-1.5 rounded-xl transition"
                        >
                          + List / లిస్ట్
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SHOPPING LIST TAB - Also incorporating Fast-Add panel */}
          {activeTab === 'shopping_list' && (
            <div className="flex flex-col lg:flex-row gap-6 animate-fadeIn">
              
              {/* Main table area */}
              <div className="flex-1 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800">Shopping List / కొనుగోలు పట్టిక</h2>
                    <p className="text-slate-500 mt-1">Automatic recommendations compiled based on stock levels.</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={handleReadShoppingList}
                      className="flex items-center justify-center space-x-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-150 font-bold px-4 py-2.5 rounded-xl transition text-xs"
                    >
                      <Volume2 className="w-4.5 h-4.5" />
                      <span>Read out loud / చదువు</span>
                    </button>
                    
                    <button 
                      onClick={shareToWhatsApp}
                      className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-2.5 rounded-xl transition shadow-md shadow-emerald-500/10 text-xs"
                    >
                      <Share2 className="w-4.5 h-4.5" />
                      <span>Share via WhatsApp</span>
                    </button>

                    <button 
                      onClick={downloadShoppingListPDF}
                      className="flex items-center justify-center space-x-2 bg-[#0B132B] hover:bg-slate-800 text-white font-black px-5 py-2.5 rounded-xl transition shadow-md text-xs"
                    >
                      <Download className="w-4.5 h-4.5 text-rose-400" />
                      <span>Download PDF</span>
                    </button>

                    <button 
                      onClick={triggerAdd}
                      className="flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black px-5 py-2.5 rounded-xl hover:opacity-95 transition shadow-md text-xs"
                    >
                      <PlusCircle className="w-4.5 h-4.5" />
                      <span>Create New Item</span>
                    </button>
                  </div>
                </div>

                {/* Add Custom Item to Shopping List form */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
                  <div className="flex-1 w-full">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Add Custom Item to Shopping List:</label>
                    <select
                      value={selectedAddItemId}
                      onChange={(e) => setSelectedAddItemId(parseInt(e.target.value) || '')}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 bg-slate-50"
                    >
                      <option value="">-- Select an Item / సరుకును ఎంచుకోండి --</option>
                      {inventory.map((item: any) => (
                        <option key={item.id} value={item.id}>
                          {item.english_name} {item.telugu_name ? `(${item.telugu_name})` : ''} - {item.category}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="w-full md:w-32">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Quantity:</label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={addQuantity}
                      onChange={(e) => setAddQuantity(parseFloat(e.target.value) || 1)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 bg-slate-50"
                    />
                  </div>

                  <button
                    onClick={handleAddCustomToShoppingList}
                    className="w-full md:w-auto bg-[#0B132B] hover:bg-slate-800 text-white text-xs font-black px-6 py-2.5 rounded-xl transition md:self-end mt-1 md:mt-0 shadow-sm"
                  >
                    + Add to List
                  </button>
                </div>

                {shoppingList.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-16 text-center">
                    <CheckSquare className="w-16 h-16 mx-auto text-emerald-500 animate-bounce mb-3" />
                    <p className="font-black text-slate-800 text-base">All grocery demands are fully satisfied!</p>
                    <p className="text-xs text-slate-400 mt-1">No items require purchasing.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Table 1: Pachari Purchases */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-4">
                      <h3 className="text-base font-black text-[#0B132B] flex items-center space-x-2 pb-3 border-b border-slate-150">
                        <Layers className="w-5 h-5 text-emerald-500 animate-pulse" />
                        <span>Pachari Pantry Purchases / పచారీ సరుకులు ({pachariShoppingList.length} items)</span>
                      </h3>
                      
                      {pachariShoppingList.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                          <p className="font-bold text-slate-500 text-xs">No Pachari items require purchasing.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Grocery / సరుకు పేరు</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Quantity Required</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Est. Cost</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {pachariShoppingList.map((item: any) => (
                                <tr key={item.id} className="hover:bg-slate-50/30 transition">
                                  <td className="p-4">
                                    {renderItemName(item, 'large')}
                                  </td>
                                  <td className="p-4">
                                    <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                      {item.category}
                                    </span>
                                  </td>
                                  <td className="p-4 text-right">
                                    <div className="flex items-center justify-end space-x-2">
                                      <button 
                                        onClick={() => updateShoppingListQty(item, -1)}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg transition"
                                      >
                                        <Minus className="w-3.5 h-3.5" />
                                      </button>
                                      <input 
                                        type="number"
                                        min="0.1"
                                        step="any"
                                        value={item.quantity}
                                        onChange={(e) => {
                                          const val = parseFloat(e.target.value) || 0;
                                          handleUpdateShoppingListQtyValue(item.id, val);
                                        }}
                                        className="w-12 text-center font-black text-slate-800 text-sm bg-slate-50 border border-slate-200 rounded-lg py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                      />
                                      <button 
                                        onClick={() => updateShoppingListQty(item, 1)}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg transition"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </button>
                                      <span className="text-slate-500 font-extrabold text-xs ml-1">{item.unit}</span>
                                    </div>
                                  </td>
                                  <td className="p-4 text-right font-black text-emerald-600 text-sm">
                                    Rs. {((item.price || 0) * item.quantity).toFixed(2)}
                                    <span className="text-[9px] text-slate-400 block font-normal mt-0.5">Rs. {item.price}/{item.unit}</span>
                                  </td>
                                  <td className="p-4 text-center">
                                    <div className="flex items-center justify-center space-x-2">
                                      <button
                                        onClick={() => triggerPurchase(item)}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs transition shadow-sm"
                                      >
                                        Mark Purchased
                                      </button>
                                      <button
                                        onClick={() => deleteFromShoppingList(item.id)}
                                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                        title="Remove from list"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Table 2: General & Fancy Purchases */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-4">
                      <h3 className="text-base font-black text-[#0B132B] flex items-center space-x-2 pb-3 border-b border-slate-150">
                        <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                        <span>General & Fancy Purchases / జనరల్ & ఫ్యాన్సీ ({fancyShoppingList.length} items)</span>
                      </h3>
                      
                      {fancyShoppingList.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                          <p className="font-bold text-slate-500 text-xs">No General & Fancy items require purchasing.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Grocery / సరుకు పేరు</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Quantity Required</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Est. Cost</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {fancyShoppingList.map((item: any) => (
                                <tr key={item.id} className="hover:bg-slate-50/30 transition">
                                  <td className="p-4">
                                    {renderItemName(item, 'large')}
                                  </td>
                                  <td className="p-4">
                                    <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                                      {item.category}
                                    </span>
                                  </td>
                                  <td className="p-4 text-right">
                                    <div className="flex items-center justify-end space-x-2">
                                      <button 
                                        onClick={() => updateShoppingListQty(item, -1)}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg transition"
                                      >
                                        <Minus className="w-3.5 h-3.5" />
                                      </button>
                                      <input 
                                        type="number"
                                        min="0.1"
                                        step="any"
                                        value={item.quantity}
                                        onChange={(e) => {
                                          const val = parseFloat(e.target.value) || 0;
                                          handleUpdateShoppingListQtyValue(item.id, val);
                                        }}
                                        className="w-12 text-center font-black text-slate-800 text-sm bg-slate-50 border border-slate-200 rounded-lg py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                      />
                                      <button 
                                        onClick={() => updateShoppingListQty(item, 1)}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg transition"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </button>
                                      <span className="text-slate-500 font-extrabold text-xs ml-1">{item.unit}</span>
                                    </div>
                                  </td>
                                  <td className="p-4 text-right font-black text-emerald-600 text-sm">
                                    Rs. {((item.price || 0) * item.quantity).toFixed(2)}
                                    <span className="text-[9px] text-slate-400 block font-normal mt-0.5">Rs. {item.price}/{item.unit}</span>
                                  </td>
                                  <td className="p-4 text-center">
                                    <div className="flex items-center justify-center space-x-2">
                                      <button
                                        onClick={() => triggerPurchase(item)}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs transition shadow-sm"
                                      >
                                        Mark Purchased
                                      </button>
                                      <button
                                        onClick={() => deleteFromShoppingList(item.id)}
                                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                        title="Remove from list"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Side Fast Add Panel */}
              <div className="w-full lg:w-80 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 shrink-0">
                <div>
                  <h3 className="text-base font-black text-slate-800 flex items-center space-x-2">
                    <Sparkles className="w-4.5 h-4.5 text-emerald-500" />
                    <span>Quick-Add Groceries</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Quickly append items directly into stock or shopping lists.</p>
                </div>
                
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {COMMON_ITEMS.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50 flex flex-col justify-between hover:bg-slate-100/20 transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-extrabold text-xs text-slate-800">{item.english_name}</p>
                          <p className="text-[10px] text-emerald-600 font-bold">{item.telugu_name}</p>
                        </div>
                        <span className="text-[9px] font-black text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">{item.unit}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-100">
                        <button
                          onClick={() => handleFastAddItem(item, 'stock')}
                          className="bg-white border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 text-slate-700 hover:text-emerald-700 text-[10px] font-bold py-1.5 rounded-xl transition"
                        >
                          + Stock / నిల్వ
                        </button>
                        <button
                          onClick={() => handleFastAddItem(item, 'list')}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold py-1.5 rounded-xl transition"
                        >
                          + List / లిస్ట్
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {/* QUICK REPLENISH TAB */}
          {activeTab === 'quick_replenish' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-800">Quick Replenish & Presets / ఖాళీ అయినవి & త్వరిత నిల్వ</h2>
                <p className="text-slate-500 mt-1">One-click grocery replenishment and common kitchen stock presets.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Out of Stock (0 Qty) column */}
                <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-rose-100 shadow-sm flex flex-col justify-between h-fit">
                  <div>
                    <h3 className="text-lg font-black text-rose-800 flex items-center space-x-2">
                      <AlertTriangle className="text-rose-500 w-5 h-5 animate-pulse" />
                      <span>Out of Stock / ఖాళీ అయినవి</span>
                    </h3>
                    <p className="text-slate-400 text-xs mt-1">Items currently completely finished (0 stock).</p>

                    {/* Stock Tab Selectors */}
                    <div className="flex space-x-1.5 bg-slate-100 p-1 rounded-xl mt-4 mb-4">
                      <button
                        onClick={() => setReplenishStockTab('pachari')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                          replenishStockTab === 'pachari' ? 'bg-[#0B132B] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/50'
                        }`}
                      >
                        Pachari / పచారీ
                      </button>
                      <button
                        onClick={() => setReplenishStockTab('fancy')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                          replenishStockTab === 'fancy' ? 'bg-[#0B132B] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/50'
                        }`}
                      >
                        General & Fancy / జనరల్
                      </button>
                    </div>
                    
                    <div className="mt-2 space-y-4 max-h-[420px] overflow-y-auto pr-1">
                      {inventory.filter((item: any) => item.quantity === 0 && (replenishStockTab === 'pachari' ? isPachariItem(item) : !isPachariItem(item))).length === 0 ? (
                        <div className="text-center py-12 text-slate-300 font-extrabold text-xs">
                          🎉 No items are completely out of stock in this domain!
                        </div>
                      ) : (
                        inventory
                          .filter((item: any) => item.quantity === 0 && (replenishStockTab === 'pachari' ? isPachariItem(item) : !isPachariItem(item)))
                          .map((item: any) => (
                            <div key={item.id} className="p-4 bg-rose-50/20 hover:bg-rose-50/50 rounded-2xl border border-rose-100/50 transition flex flex-col space-y-3">
                              <div className="flex justify-between items-start">
                                {renderItemName(item, 'large')}
                                <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 uppercase">{item.unit}</span>
                              </div>
                              <button
                                onClick={async () => {
                                  // Determine quantity to replenish
                                  const qty = item.threshold > 0 ? item.threshold * 2 : 2;
                                  const price = item.price || 50;
                                  try {
                                    setLoading(true);
                                    const res = await fetch(`${API_BASE}/shopping-list/purchase`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ item_id: item.id, quantity: qty, price_per_unit: price })
                                    });
                                    if (res.ok) {
                                      confetti({ particleCount: 70, spread: 50 });
                                      fetchData();
                                      speakText(`${item.telugu_name || item.english_name} కొనుగోలు పూర్తి అయింది.`, `Quick replenished ${item.english_name}.`);
                                      showPopupNotification(`Replenished ${qty} ${item.unit} of ${item.english_name}.`);
                                    }
                                  } catch (err) {
                                    console.error(err);
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                                className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-black py-2.5 rounded-xl transition shadow-sm"
                              >
                                Mark Completed / వచ్చింది
                              </button>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Common Presets column */}
                <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-fit">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 flex items-center space-x-2">
                      <Sparkles className="text-emerald-500 w-5 h-5" />
                      <span>Common Presets / సాధారణ సరుకులు</span>
                    </h3>
                    <p className="text-slate-400 text-xs mt-1">Click "+ Complete" to immediately add preset to inventory.</p>

                    {/* Preset Tab Selectors */}
                    <div className="flex space-x-1.5 bg-slate-100 p-1 rounded-xl mt-4 mb-4">
                      <button
                        onClick={() => setReplenishPresetTab('pachari')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                          replenishPresetTab === 'pachari' ? 'bg-[#0B132B] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/50'
                        }`}
                      >
                        Pachari / పచారీ
                      </button>
                      <button
                        onClick={() => setReplenishPresetTab('fancy')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                          replenishPresetTab === 'fancy' ? 'bg-[#0B132B] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/50'
                        }`}
                      >
                        General & Fancy / జనరల్
                      </button>
                    </div>

                    <div className="mt-2 space-y-4 max-h-[420px] overflow-y-auto pr-1">
                      {COMMON_ITEMS.filter(preset => replenishPresetTab === 'pachari' ? isPachariItem(preset) : !isPachariItem(preset)).map((preset, idx) => {
                        // Check if already in inventory
                        const existing = inventory.find(
                          i => i.english_name.toLowerCase() === preset.english_name.toLowerCase()
                        );
                        const qty = existing ? existing.quantity : 0;
                        return (
                          <div key={idx} className="p-4 bg-slate-50 hover:bg-slate-100/50 rounded-2xl border border-slate-100 flex flex-col space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-extrabold text-slate-800 text-xs">{preset.english_name}</p>
                                <p className="text-xs text-emerald-600 font-bold">{preset.telugu_name}</p>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] font-black text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200 uppercase">{preset.unit}</span>
                                {existing && (
                                  <p className="text-[10px] text-slate-500 font-bold mt-1">Stock: {qty} {preset.unit}</p>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={async () => {
                                  try {
                                    setLoading(true);
                                    let targetId = existing?.id;
                                    if (!existing) {
                                      const res = await fetch(`${API_BASE}/inventory`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          english_name: preset.english_name,
                                          telugu_name: preset.telugu_name,
                                          quantity: 0,
                                          unit: preset.unit,
                                          threshold: preset.threshold,
                                          category: preset.category,
                                          price: preset.price
                                        })
                                      });
                                      const data = await res.json();
                                      targetId = data.id;
                                    }

                                    const qtyToBuy = preset.threshold > 0 ? preset.threshold * 2 : 2;
                                    const purchaseRes = await fetch(`${API_BASE}/shopping-list/purchase`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        item_id: targetId,
                                        quantity: qtyToBuy,
                                        price_per_unit: preset.price
                                      })
                                    });

                                    if (purchaseRes.ok) {
                                      confetti({ particleCount: 70, spread: 50 });
                                      fetchData();
                                      speakText(`${preset.telugu_name} నేరుగా చేర్చాము.`, `Completed preset purchase of ${preset.english_name}.`);
                                      showPopupNotification(`Completed: Added ${qtyToBuy} ${preset.unit} of ${preset.english_name}.`);
                                    }
                                  } catch (err) {
                                    console.error(err);
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black py-2 rounded-xl transition shadow-sm"
                              >
                                + Complete / కొన్నాను
                              </button>
                              <button
                                onClick={() => handleFastAddItem(preset, 'list')}
                                className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black py-2 rounded-xl transition"
                              >
                                + List / లిస్ట్‌లో
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Recently Completed column */}
                <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-fit">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 flex items-center space-x-2">
                      <CheckSquare className="text-indigo-500 w-5 h-5" />
                      <span>Recently Completed / ఇటీవల కొన్నవి</span>
                    </h3>
                    <p className="text-slate-400 text-xs mt-1">Latest purchases successfully completed.</p>

                    <div className="mt-5 space-y-4 max-h-[500px] overflow-y-auto pr-1">
                      {purchaseHistory.length === 0 ? (
                        <div className="text-center py-12 text-slate-300 font-extrabold">
                          No recent completed purchases.
                        </div>
                      ) : (
                        purchaseHistory.map((history: any) => (
                          <div key={history.id} className="p-4 bg-indigo-50/10 hover:bg-indigo-50/20 rounded-2xl border border-indigo-50/40 transition flex flex-col space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-extrabold text-xs text-slate-800">{history.english_name}</p>
                                <p className="text-[10px] text-emerald-600 font-bold">{history.telugu_name}</p>
                              </div>
                              <span className="text-[10px] font-black text-emerald-600">Rs. {history.total_price}</span>
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-400 font-bold border-t border-slate-100/60 pt-1.5">
                              <span>Bought: {history.quantity} {history.unit}</span>
                              <span>{new Date(history.purchase_date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VOICE CONTROLLER PAGE */}
          {activeTab === 'voice_assistant' && (
            <div className="max-w-2xl mx-auto space-y-6 py-4 animate-fadeIn">
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-black text-slate-800 font-sans">Voice Assistant / వాయిస్ కంట్రోల్స్</h2>
                <p className="text-slate-500">Bilingual speech assistant. Switch pages or edit inventory by speaking.</p>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl text-center space-y-6 relative overflow-hidden">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Language:</span>
                    <select 
                      value={speechLanguage}
                      onChange={(e) => setSpeechLanguage(e.target.value)}
                      className="bg-white border border-slate-200 text-xs font-bold rounded-xl px-2.5 py-1 focus:outline-none"
                    >
                      <option value="te-IN">Telugu (తెలుగు)</option>
                      <option value="en-US">English (US)</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Speech Speaker:</span>
                    <input 
                      type="checkbox" 
                      checked={ttsEnabled} 
                      onChange={(e) => setTtsEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500"
                    />
                  </div>
                </div>

                <div className="py-6 flex flex-col items-center justify-center space-y-4">
                  <button
                    onClick={toggleRecording}
                    className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                      isRecording 
                        ? 'bg-rose-500 hover:bg-rose-600 ring-8 ring-rose-500/20 scale-105 animate-pulse' 
                        : 'bg-emerald-500 hover:bg-emerald-600 ring-8 ring-emerald-500/10'
                    }`}
                  >
                    {isRecording ? (
                      <MicOff className="w-12 h-12 text-white" />
                    ) : (
                      <Mic className="w-12 h-12 text-white" />
                    )}
                  </button>
                  <div>
                    <h3 className="font-black text-lg text-slate-800">
                      {isRecording ? "Listening to Voice..." : "Tap Button to Speak"}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {isRecording ? "చెప్పండి, నేను వింటున్నాను..." : "Try saying: 'open settings' or 'నిల్వలు చూపించు'"}
                    </p>
                  </div>
                </div>

                {/* Text command input fallback for non-secure HTTP contexts */}
                <div className="border-t border-slate-100 pt-6 mt-4 space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase block text-left">
                    Type Command Fallback / టైప్ కమాండ్ (HTTP Network Workaround)
                  </label>
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!typedCommand.trim()) return;
                      const cmd = typedCommand;
                      setTranscription(cmd);
                      setTypedCommand('');
                      await processVoiceCommand(cmd);
                    }}
                    className="flex space-x-2"
                  >
                    <input 
                      type="text" 
                      value={typedCommand} 
                      onChange={(e) => setTypedCommand(e.target.value)} 
                      placeholder="Type command here... e.g. open settings, ఉల్లిపాయలు 5 kg చేర్చు" 
                      className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                    <button 
                      type="submit" 
                      className="bg-[#0B132B] hover:bg-[#1a2542] text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-sm"
                    >
                      Send / పంపించు
                    </button>
                  </form>
                  <p className="text-[10px] text-slate-400 text-left leading-relaxed">
                    * Since the browser restricts microphone access under insecure network IPs (like <code>http://192.168.x.x</code>), use this input box to type your commands directly. They will be processed exactly like spoken commands.
                  </p>
                </div>

                {transcription && (
                  <div className="bg-slate-50 p-5 rounded-2xl text-left border border-slate-100 space-y-1">
                    <span className="text-[9px] font-black tracking-wider text-slate-400 uppercase">Input Text:</span>
                    <p className="text-slate-800 font-extrabold text-base italic">"{transcription}"</p>
                  </div>
                )}

                {voiceResult && (
                  <div className="bg-emerald-50/50 p-5 rounded-2xl text-left border border-emerald-100/50 space-y-2">
                    <div className="flex items-center space-x-2 text-emerald-700">
                      <Sparkles className="w-4.5 h-4.5 animate-spin" />
                      <span className="text-xs font-black uppercase tracking-wider">Action Executed</span>
                    </div>
                    <div>
                      <p className="text-slate-800 font-bold text-base">{voiceResult.message_telugu}</p>
                      <p className="text-slate-500 text-xs mt-1">{voiceResult.message_english}</p>
                    </div>
                  </div>
                )}

                {voiceError && (
                  <div className="bg-rose-50 p-4 rounded-2xl text-left border border-rose-100 flex items-start space-x-3 text-rose-800">
                    <Info className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-xs font-bold">{voiceError}</p>
                  </div>
                )}
              </div>

              {/* Navigation commands help */}
              <div className="bg-indigo-50/40 p-5 rounded-3xl border border-indigo-50/80 flex items-start space-x-4">
                <Info className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
                <div className="space-y-2 w-full">
                  <h4 className="font-extrabold text-slate-800 text-sm"> Bilingual Page Navigation Commands / నావిగేషన్ ఆదేశాలు:</h4>
                  <p className="text-xs text-slate-500">You can say these commands to navigate directly to each section:</p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700 font-semibold pl-2 mt-2">
                    <li className="flex items-center space-x-1.5">
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>"go home" / "హోమ్ పేజీ" ➔ Dashboard</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>"open pachari" / "పచారీ సరుకులు" ➔ Pachari Pantry</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>"open general" / "జనరల్ మరియు ఫ్యాన్సీ" ➔ General & Fancy</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>"open shopping list" / "షాపింగ్" ➔ Shopping List</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>"open quick replenish" / "త్వరిత నిల్వ" ➔ Quick Replenish</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>"open analytics" / "విశ్లేషణ" ➔ Analytics</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>"open settings" / "సెట్టింగ్స్" ➔ Settings</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Vocabulary Items Help Section */}
              <div className="bg-emerald-50/20 p-5 rounded-3xl border border-emerald-50 flex items-start space-x-4">
                <Sparkles className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                <div className="space-y-3 w-full">
                  <h4 className="font-extrabold text-slate-800 text-sm">Supported Kitchen Items / ఉపయోగించగల సరుకుల పేర్లు:</h4>
                  <p className="text-xs text-slate-500">The assistant recognizes these specific item names in both Telugu and English:</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Pachari / పచారీ సరుకులు</p>
                      <ul className="text-xs text-slate-700 font-semibold space-y-1 pl-2">
                        <li>🌾 Rice / బియ్యం</li>
                        <li>🍬 Sugar / చక్కెర / పంచదార</li>
                        <li>🛢️ Oil / నూనె / సన్ ఫ్లవర్ నూనె</li>
                        <li>🍲 Toor Dal / కందిపప్పు</li>
                        <li>🌿 Tamarind / చింతపండు</li>
                        <li>💛 Turmeric / పసుపు</li>
                        <li>🥜 Groundnuts / వేరుశనగపప్పులు</li>
                        <li>🌾 Wheat Flour / గోధుమ పిండి</li>
                        <li>🧄 Garlic / తెల్లగడ్డలు / వెల్లుల్లి</li>
                        <li>🧅 Onions / ఉల్లిపాయలు</li>
                        <li>🧂 Salt / ఉప్పు / కల్లు ఉప్పు</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-wider">General & Fancy / జనరల్ & ఫ్యాన్సీ</p>
                      <ul className="text-xs text-slate-700 font-semibold space-y-1 pl-2">
                        <li>🧼 Exo Soap / ఎక్సో సబ్బు</li>
                        <li>🥛 Milk / పాలు</li>
                        <li>🪥 Colgate / కోల్గేట్ పేస్ట్</li>
                        <li>☕ Horlicks / హార్లిక్స్</li>
                        <li>🍜 Maggi / మ్యాగీ</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Secure Context & Permissions Alert */}
              <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex items-start space-x-4">
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-3">
                  <h4 className="font-extrabold text-amber-900 text-sm">Voice Assistant Setup for http://192.168.0.104:5173 / వాయిస్ సదుపాయం ఎలా పనిచేస్తుంది:</h4>
                  <p className="text-xs text-amber-800 leading-relaxed font-semibold">
                    Browsers restrict microphone access (`SpeechRecognition`) under standard `http://` network IP connections. To make it work seamlessly on your phone or computer, use one of the two methods below:
                  </p>
                  
                  <div className="space-y-3 pl-2">
                    <div className="text-xs text-amber-900 font-bold">
                      <p className="text-emerald-700">🔒 Method A: Enable Microphone on Chrome (Recommended / సిఫార్సు చేయబడింది)</p>
                      <p className="text-slate-600 font-medium mt-1">
                        To use the microphone over this network address, open Chrome on your phone or computer, copy-paste this link in the address bar, and press Enter:
                      </p>
                      <code className="block bg-amber-100/60 p-2 rounded text-[10px] font-mono select-all text-slate-700 mt-1">
                        chrome://flags/#unsafely-treat-insecure-origin-as-secure
                      </code>
                      <p className="text-slate-600 font-medium mt-1.5">
                        In the input field of that flag, enter: <code className="bg-amber-100 px-1 rounded text-slate-800">http://{window.location.hostname}:5173</code>, set it to <strong>Enabled</strong>, and tap <strong>Relaunch</strong>. This forces the browser to treat this network address as secure and unlock full microphone/speech capabilities!
                      </p>
                    </div>

                    <div className="text-xs text-amber-900 font-bold border-t border-amber-200/50 pt-2">
                      <p className="text-slate-700">⌨️ Method B: Use Type Command Fallback (టైప్ కమాండ్)</p>
                      <p className="text-slate-600 font-medium mt-1">
                        If you do not wish to configure flags, you can type your commands in the <strong>Type Command Fallback</strong> text field above.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-800">Analytics & Spending Trends</h2>
                <p className="text-slate-500 mt-1">Visualize grocery spending metrics and pantry consumption trends.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <div>
                    <h4 className="text-base font-black text-slate-800">Monthly Grocery Costs</h4>
                    <p className="text-slate-400 text-xs mt-0.5">Expenses over time.</p>
                  </div>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.monthlyExpenses} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <Tooltip formatter={(value) => [`Rs. ${value}`, 'Expense']} />
                        <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <div>
                    <h4 className="text-base font-black text-slate-800">Top Spent Items</h4>
                    <p className="text-slate-400 text-xs mt-0.5">Highest grocery expenses.</p>
                  </div>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.topItems} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <Tooltip formatter={(value) => [`Rs. ${value}`, 'Cost']} />
                        <Bar dataKey="value" fill="#4f46e5" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 lg:col-span-2">
                  <div>
                    <h4 className="text-base font-black text-slate-800">Category Spending Distributions</h4>
                    <p className="text-slate-400 text-xs mt-0.5">Ratio distribution of kitchen investments.</p>
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-center justify-around gap-6">
                    <div className="h-64 w-64 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.categoryExpenses}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {analytics.categoryExpenses.map((_entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'][index % 7]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`Rs. ${value}`, 'Cost']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-4 flex-1 max-w-xl">
                      {analytics.categoryExpenses.map((entry: any, index: number) => (
                        <div key={entry.category} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                          <span 
                            className="w-4 h-4 rounded-full shrink-0" 
                            style={{ backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'][index % 7] }}
                          />
                          <div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{entry.category}</p>
                            <p className="font-extrabold text-slate-800 text-sm">Rs. {entry.value.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-6 py-4 animate-fadeIn">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-800">Accessibility Settings / సెట్టింగులు</h2>
                <p className="text-slate-500">Configure language, speak options, and font display layouts.</p>
              </div>

              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <h4 className="font-black text-slate-800 flex items-center space-x-2">
                    <span>Accessibility & View</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase block mb-1.5">Text Display Size:</label>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setFontSize('normal')}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold border ${
                            fontSize === 'normal' 
                              ? 'bg-[#0B132B] border-[#0B132B] text-white shadow-sm' 
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Normal / సాధారణ
                        </button>
                        <button
                          onClick={() => setFontSize('large')}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold border ${
                            fontSize === 'large' 
                              ? 'bg-[#0B132B] border-[#0B132B] text-white shadow-sm' 
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Large / పెద్ద ఫాంట్
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase block mb-1.5">Voice Engine Language:</label>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSpeechLanguage('te-IN')}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold border ${
                            speechLanguage === 'te-IN' 
                              ? 'bg-[#0B132B] border-[#0B132B] text-white shadow-sm' 
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Telugu / తెలుగు
                        </button>
                        <button
                          onClick={() => setSpeechLanguage('en-US')}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold border ${
                            speechLanguage === 'en-US' 
                              ? 'bg-[#0B132B] border-[#0B132B] text-white shadow-sm' 
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          English
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl">
                      <span className="text-xs font-bold text-[#0B132B]">Narration (Text-to-Speech) Status</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold uppercase px-2.5 py-1 rounded-lg">Active / ఆన్</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">
                      * Voice prompts will read out list completions automatically to assist elderly users.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <h4 className="font-black text-slate-800 flex items-center space-x-2">
                    <span>Device Sharing & Hosting / ఇతర పరికరాలలో ఉపయోగించడం</span>
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    To use this smart inventory assistant on other devices (like your mother's phone or tablet), connect them to the same Wi-Fi network and open the following address in the web browser:
                  </p>
                  <div className="bg-[#0B132B] text-emerald-400 font-mono text-center p-4 rounded-2xl text-base font-black tracking-wide border border-slate-900 shadow-inner select-all">
                    http://{window.location.hostname}:5173
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100 text-xs font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>Make sure the backend server (on port 5000) is also running on the host computer.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Persistent Floating Microphone Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={toggleRecording}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
            isRecording 
              ? 'bg-rose-500 text-white ring-8 ring-rose-500/25 scale-110' 
              : 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white hover:scale-105 shadow-emerald-500/30'
          }`}
          title="Click to speak command / వాయిస్ అసిస్టెంట్"
        >
          {isRecording ? <MicOff className="w-8 h-8 animate-pulse" /> : <Mic className="w-8 h-8" />}
        </button>
      </div>

      {/* 1. Add Inventory Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveItem} className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-100">
            <h3 className="text-lg font-black text-slate-800">Add Pantry Item / వస్తువు చేర్చు</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Telugu Name * (సరుకు పేరు - e.g., బియ్యం, నూనె)</label>
                <input 
                  type="text"
                  required={!itemForm.english_name}
                  value={itemForm.telugu_name}
                  onChange={(e) => setItemForm({ ...itemForm, telugu_name: e.target.value })}
                  placeholder="ఉదాహరణ: బియ్యం"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm font-semibold"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-400 uppercase">English Name (Optional - auto-translated if empty)</label>
                <input 
                  type="text" 
                  required={!itemForm.telugu_name}
                  value={itemForm.english_name}
                  onChange={(e) => setItemForm({ ...itemForm, english_name: e.target.value })}
                  placeholder="e.g. Rice"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Stock Quantity *</label>
                <input 
                  type="number" 
                  step="any"
                  required
                  value={itemForm.quantity}
                  onChange={(e) => setItemForm({ ...itemForm, quantity: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Unit *</label>
                <select 
                  value={itemForm.unit}
                  onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm font-bold"
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Low Stock Threshold *</label>
                <input 
                  type="number" 
                  step="any"
                  required
                  value={itemForm.threshold}
                  onChange={(e) => setItemForm({ ...itemForm, threshold: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Unit Price (₹) *</label>
                <input 
                  type="number" 
                  step="any"
                  required
                  value={itemForm.price}
                  onChange={(e) => setItemForm({ ...itemForm, price: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm font-semibold"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Category *</label>
                <select 
                  value={itemForm.category}
                  onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm font-bold"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="flex space-x-3 pt-3 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition text-xs"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition shadow-sm text-xs"
              >
                Save Item
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Edit Inventory Item Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveItem} className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-100">
            <h3 className="text-lg font-black text-slate-800">Edit Pantry Item / సవరించు</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Telugu Name * (సరుకు పేరు - e.g., బియ్యం, నూనె)</label>
                <input 
                  type="text"
                  required={!itemForm.english_name}
                  value={itemForm.telugu_name}
                  onChange={(e) => setItemForm({ ...itemForm, telugu_name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm font-semibold"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-400 uppercase">English Name (Optional - auto-translated if empty)</label>
                <input 
                  type="text" 
                  required={!itemForm.telugu_name}
                  value={itemForm.english_name}
                  onChange={(e) => setItemForm({ ...itemForm, english_name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Stock Quantity *</label>
                <input 
                  type="number" 
                  step="any"
                  required
                  value={itemForm.quantity}
                  onChange={(e) => setItemForm({ ...itemForm, quantity: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Unit *</label>
                <select 
                  value={itemForm.unit}
                  onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm font-bold"
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Low Stock Threshold *</label>
                <input 
                  type="number" 
                  step="any"
                  required
                  value={itemForm.threshold}
                  onChange={(e) => setItemForm({ ...itemForm, threshold: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Unit Price (₹) *</label>
                <input 
                  type="number" 
                  step="any"
                  required
                  value={itemForm.price}
                  onChange={(e) => setItemForm({ ...itemForm, price: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm font-semibold"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Category *</label>
                <select 
                  value={itemForm.category}
                  onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm font-bold"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="flex space-x-3 pt-3 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition text-xs"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition shadow-sm text-xs"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Mark Purchased Completion Modal */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCompletePurchase} className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-800">Complete Purchase / కొనుగోలు పూర్తి చేయండి</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Buying {purchaseForm.english_name} {purchaseForm.telugu_name ? `/ ${purchaseForm.telugu_name}` : ''}.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Quantity Bought ({purchaseForm.unit}) *</label>
                <input 
                  type="number" 
                  step="any"
                  required
                  value={purchaseForm.quantity}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Price Paid per {purchaseForm.unit} (Rs.) *</label>
                <input 
                  type="number" 
                  step="any"
                  required
                  value={purchaseForm.price_per_unit}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, price_per_unit: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-bold text-emerald-600"
                />
              </div>

              <div className="bg-emerald-50/50 p-4 rounded-2xl flex justify-between items-center text-emerald-800">
                <span className="text-xs font-extrabold uppercase">Total Cost:</span>
                <span className="text-lg font-black">Rs. {(purchaseForm.quantity * purchaseForm.price_per_unit).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex space-x-3 pt-3 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => setIsPurchaseModalOpen(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition shadow-sm"
              >
                Complete Purchase
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
