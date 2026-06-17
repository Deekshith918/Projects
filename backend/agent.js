import { GoogleGenerativeAI } from '@google/generative-ai';
import db from './db.js';

// Hardcoded vocabulary mapping for local fallback rule engine
const VOCABULARY = {
  // Telugu script
  'బియ్యం': 'Rice',
  'పంచదార': 'Sugar',
  'చక్కెర': 'Sugar',
  'నూనె': 'Sunflower Oil',
  'నూనెలు': 'Sunflower Oil',
  'కందిపప్పు': 'Toor Dal',
  'పాలు': 'Milk',
  'పెరుగు': 'Curd',
  'వెన్న': 'Butter',
  'వెన్నపూస': 'Butter',
  'నెయ్యి': 'Ghee',
  'చీజ్': 'Cheese',
  'చీజ్ స్లైస్': 'Cheese',
  'మ్యాగీ': 'Maggi',
  'హార్లిక్స్': 'Horlicks',
  'కోల్గేట్': 'Colgate Paste',
  'కోల్గేట్ పేస్ట్': 'Colgate Paste',
  'ఉల్లిపాయలు': 'Onions',
  'ఉల్లిపాయ': 'Onions',
  'ఉల్లిగడ్డలు': 'Onions',
  'ఉల్లిగడ్డ': 'Onions',
  'వెల్లుల్లిపాయలు': 'Garlic',
  'వెల్లుల్లిపాయ': 'Garlic',
  'తెల్లగడ్డలు': 'Garlic',
  'తెల్లగడ్డ': 'Garlic',
  'వెల్లుల్లి': 'Garlic',
  'ఉప్పు': 'Salt',
  'కల్లు ఉప్పు': 'Salt',
  'చింతపండు': 'Tamarind',
  'పసుపు': 'Turmeric',
  'వేరుశనగపప్పులు': 'Groundnuts',
  'గోధుమ పిండి': 'Wheat Flour',
  'గోధుమ రవ్వ': 'Wheat Rava',
  'బొంబాయి రవ్వ': 'Bombay Rava',
  'మినపప్పు': 'Urad Dal',
  'బెల్లం': 'Jaggery',
  'ఆవాలు': 'Mustard',
  'జీలకర్ర': 'Cumin',
  'ఎక్సో సబ్బు': 'Exo Soap',

  // transliterated telugu / english
  'rice': 'Rice',
  'biyyam': 'Rice',
  'sugar': 'Sugar',
  'panchadara': 'Sugar',
  'chakkera': 'Sugar',
  'oil': 'Sunflower Oil',
  'nune': 'Sunflower Oil',
  'dal': 'Toor Dal',
  'kandipappu': 'Toor Dal',
  'milk': 'Milk',
  'paalu': 'Milk',
  'curd': 'Curd',
  'perugu': 'Curd',
  'yogurt': 'Curd',
  'butter': 'Butter',
  'venna': 'Butter',
  'vennapusa': 'Butter',
  'ghee': 'Ghee',
  'neyyi': 'Ghee',
  'cheese': 'Cheese',
  'cheez': 'Cheese',
  'maggi': 'Maggi',
  'horlicks': 'Horlicks',
  'colgate': 'Colgate Paste',
  'exo soap': 'Exo Soap',
  'exo': 'Exo Soap',
  'onions': 'Onions',
  'onion': 'Onions',
  'ullipayalu': 'Onions',
  'ullipaya': 'Onions',
  'ulligaddalu': 'Onions',
  'ulligadda': 'Onions',
  'garlic': 'Garlic',
  'vellullipayalu': 'Garlic',
  'vellullipaya': 'Garlic',
  'tellagaddalu': 'Garlic',
  'tellagadda': 'Garlic',
  'vellulli': 'Garlic',
  'salt': 'Salt',
  'tamarind': 'Tamarind',
  'chinthapandu': 'Tamarind',
  'turmeric': 'Turmeric',
  'pasupu': 'Turmeric',
  'groundnuts': 'Groundnuts',
  'verusanagapappu': 'Groundnuts',
  'wheat flour': 'Wheat Flour',
  'godhuma pindi': 'Wheat Flour',
  'jaggery': 'Jaggery',
  'bellam': 'Jaggery'
};

const TELUGU_NUMBERS = {
  'ఒకటి': 1, 'ఒక': 1, 'one': 1,
  'రెండు': 2, 'two': 2,
  'మూడు': 3, 'three': 3,
  'నాలుగు': 4, 'four': 4,
  'ఆరు': 6, 'six': 6,
  'ఏడు': 7, 'seven': 7,
  'ఎనిమిది': 8, 'eight': 8,
  'తొమ్మిది': 9, 'nine': 9,
  'పది': 10, 'ten': 10
};

const UNITS = ['Kg', 'g', 'L', 'ml', 'Packets (1L)', 'Packets', 'Pieces', 'కిలోలు', 'కిలో', 'లీటర్లు', 'లీటర్', 'ప్యాకెట్లు', 'ముక్కలు'];

// Local Rule-Based Fallback Parser (Ensures system never crashes even without API Key)
export function localRuleParser(text) {
  const lowercaseText = text.toLowerCase().trim();
  console.log('[Fallback Agent] Parsing text locally:', lowercaseText);

  // 1. Detect Item
  let matchedItemKey = null;
  let englishName = 'Custom Item';
  let teluguName = '';

  // Sort VOCABULARY keys by length descending to match longer strings first (e.g. 'వెల్లుల్లిపాయ' / 'vellullipaya' before 'ఉల్లిపాయ' / 'ullipaya')
  const sortedKeys = Object.keys(VOCABULARY).sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    if (lowercaseText.includes(key)) {
      matchedItemKey = key;
      englishName = VOCABULARY[key];
      // Find the first Telugu script vocabulary key mapping to this standard item
      teluguName = Object.keys(VOCABULARY).find(k => VOCABULARY[k] === englishName && /[\u0c00-\u0c7f]/.test(k)) || '';
      break;
    }
  }

  if (!matchedItemKey) {
    const words = lowercaseText.split(/\s+/);
    const filtered = words.filter(w => !/\d/.test(w) && !UNITS.includes(w) && !['add', 'remove', 'buy', 'konali', 'ayipoindi', 'cheyyi', 'pettu'].includes(w));
    if (filtered.length > 0) {
      englishName = filtered[0].charAt(0).toUpperCase() + filtered[0].slice(1);
    }
  }

  // 2. Detect Quantity & Unit
  let quantity = 1;
  let unit = 'Pieces';

  const numMatch = lowercaseText.match(/(\d+(\.\d+)?)/);
  if (numMatch) {
    quantity = parseFloat(numMatch[1]);
  } else {
    for (const [telNum, val] of Object.entries(TELUGU_NUMBERS)) {
      if (lowercaseText.includes(telNum)) {
        quantity = val;
        break;
      }
    }
  }

  if (lowercaseText.includes('kg') || lowercaseText.includes('కిలో') || lowercaseText.includes('kilo')) {
    unit = 'Kg';
  } else if (lowercaseText.includes(' g ') || lowercaseText.endsWith(' g') || lowercaseText.includes('grams') || lowercaseText.includes('గ్రాములు')) {
    unit = 'g';
  } else if (lowercaseText.includes(' l ') || lowercaseText.includes('lit') || lowercaseText.includes('లీటర్') || lowercaseText.includes('oil')) {
    unit = 'L';
  } else if (lowercaseText.includes('ml') || lowercaseText.includes('మిల్లీ')) {
    unit = 'ml';
  } else if (lowercaseText.includes('packet') || lowercaseText.includes('ప్యాకెట్') || lowercaseText.includes('maggi')) {
    unit = 'Packets';
  }

  // 3. Detect Intent
  let intent = 'ADD_TO_SHOPPING_LIST';

  if (lowercaseText.includes('ayipoindi') || lowercaseText.includes('అయిపోయింది') || lowercaseText.includes('finished') || lowercaseText.includes('ipoyindi') || lowercaseText.includes('ఖాలీ')) {
    intent = 'UPDATE_STOCK';
    quantity = 0;
  } else if (lowercaseText.includes('konali') || lowercaseText.includes('కొనాలి') || lowercaseText.includes('kavali') || lowercaseText.includes('కావాలి') || lowercaseText.includes('shop') || lowercaseText.includes('list')) {
    intent = 'ADD_TO_SHOPPING_LIST';
  } else if (lowercaseText.includes('add') || lowercaseText.includes('చేయి') || lowercaseText.includes('పెంచు') || lowercaseText.includes('veayi') || lowercaseText.includes('పెట్టు') || lowercaseText.includes('add cheyyi')) {
    intent = 'UPDATE_STOCK';
  }

  let response_message_english = '';
  let response_message_telugu = '';

  if (intent === 'UPDATE_STOCK') {
    if (quantity === 0) {
      response_message_english = `Set stock of ${englishName} to 0. It is marked as finished.`;
      response_message_telugu = `${teluguName || englishName} అయిపోయింది, స్టాక్ 0 గా మార్చబడింది.`;
    } else {
      response_message_english = `Updated ${englishName} stock to ${quantity} ${unit}.`;
      response_message_telugu = `${teluguName || englishName} నిల్వను ${quantity} ${unit} కి అప్‌డేట్ చేసాము.`;
    }
  } else {
    response_message_english = `Added ${quantity} ${unit} of ${englishName} to shopping list.`;
    response_message_telugu = `షాపింగ్ లిస్ట్‌కు ${quantity} ${unit} ${teluguName || englishName} జోడించాము.`;
  }

  return {
    intent,
    item_english: englishName,
    item_telugu: teluguName || englishName,
    quantity,
    unit,
    response_message_english,
    response_message_telugu
  };
}

let currentKeyIndex = 0;

function getApiKeys() {
  const keysStr = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
  return keysStr.split(',').map(k => k.trim()).filter(k => k.length > 0);
}

// Unified call to rotating keys (supports Groq & Gemini text models)
async function callLLM(prompt, isJsonMode = true) {
  const keys = getApiKeys();
  if (keys.length === 0) {
    throw new Error("No API keys configured");
  }

  const startIdx = currentKeyIndex;
  
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const keyIndex = (startIdx + attempt) % keys.length;
    const apiKey = keys[keyIndex];
    
    console.log(`[LLM Agent] Attempting API call with Key Index ${keyIndex} (starts with: ${apiKey.substring(0, 8)}...)`);

    try {
      if (apiKey.startsWith('gsk_')) {
        console.log('[LLM Agent] Routing to Groq API...');
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }],
            response_format: isJsonMode ? { type: "json_object" } : undefined,
            temperature: 0.1
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Groq API returned status ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const resultText = data.choices[0].message.content;
        
        currentKeyIndex = keyIndex;
        return resultText;

      } else {
        console.log('[LLM Agent] Routing to Google Gemini API...');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          generationConfig: isJsonMode ? { responseMimeType: "application/json" } : undefined
        });

        const result = await model.generateContent(prompt);
        const resultText = result.response.text();
        
        currentKeyIndex = keyIndex;
        return resultText;
      }
    } catch (err) {
      console.error(`[LLM Agent] Error with Key Index ${keyIndex}:`, err.message);
    }
  }

  throw new Error("All configured LLM API keys failed or were rate-limited.");
}

// Multimodal call to rotating keys (skips Groq, routes to Gemini)
async function callLLMWithImage(prompt, base64Image, mimeType) {
  const keys = getApiKeys();
  if (keys.length === 0) {
    throw new Error("No API keys configured");
  }

  const startIdx = currentKeyIndex;
  
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const keyIndex = (startIdx + attempt) % keys.length;
    const apiKey = keys[keyIndex];
    
    console.log(`[LLM Agent] Attempting OCR with Key Index ${keyIndex} (starts with: ${apiKey.substring(0, 8)}...)`);

    try {
      if (apiKey.startsWith('gsk_')) {
        console.log('[LLM Agent] Groq key does not support direct image upload here. Rotating to next key...');
        continue;
      } else {
        console.log('[LLM Agent] Routing image to Google Gemini API...');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          generationConfig: { responseMimeType: "application/json" }
        });

        const imagePart = {
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const resultText = result.response.text();
        
        currentKeyIndex = keyIndex;
        return resultText;
      }
    } catch (err) {
      console.error(`[LLM Agent] OCR Error with Key Index ${keyIndex}:`, err.message);
    }
  }

  throw new Error("All Gemini API keys failed or were rate-limited for receipt parsing.");
}

// Coordinator Agent
export async function runCoordinatorAgent(text) {
  const prompt = `
    You are the Coordinator Agent for a Smart Telugu Household Inventory System.
    Your task is to parse the user's voice command (which may be in English, Telugu, or mixed Telugu-English) and determine the structured intention.

    System Inventory Items Vocabulary (for reference):
    - Rice / బియ్యం (unit: Kg)
    - Sugar / చక్కెర (unit: Kg)
    - Sunflower Oil / సన్ ఫ్లవర్ నూనె (unit: Packets (1L))
    - Toor Dal / కందిపప్పు (unit: Kg)
    - Tamarind / చింతపండు (unit: Kg)
    - Turmeric / పసుపు (unit: Kg)
    - Groundnuts / వేరుశనగపప్పులు (unit: Kg)
    - Wheat Flour / గోధుమ పిండి (unit: Kg)
    - Garlic / తెల్లగడ్డలు (unit: Kg)
    - Onions / ఉల్లిపాయలు (unit: Kg)
    - Deeparadhana Oil / దీపారాధన నూనె (unit: Packets (1L))
    - Camphor / కర్పూర బిళ్లలు (unit: Packets)
    - Exo Soap / ఎక్సో సబ్బు (unit: Pieces)
    - Milk / పాలు (unit: L)
    - Curd / పెరుగు (unit: Packets)
    - Butter / వెన్న (unit: Packets)
    - Ghee / నెయ్యి (unit: Packets)
    - Cheese / చీజ్ (unit: Packets)

    Intents list:
    1. UPDATE_STOCK: Used when user updates their current stock, e.g. "Add 5 kg rice", "Oil is finished" (quantity should be 0), "Rice 2 kg matches".
    2. ADD_TO_SHOPPING_LIST: Used when user wants to buy something, e.g. "Buy 5 kg rice", "ఐదు కిలోల బియ్యం కొనాలి", "Add sugar to shopping list".
    
    Extract:
    - intent: Either "UPDATE_STOCK" or "ADD_TO_SHOPPING_LIST"
    - item_english: Standard English name of the item. Try to match references above (e.g. "Rice", "Sugar", "Sunflower Oil", "Milk", "Toor Dal", etc.) or create a clean English name.
    - item_telugu: Matching Telugu name if known.
    - quantity: Number (default to 1 if not specified)
    - unit: Standard units: "Kg", "g", "L", "ml", "Packets (1L)", "Packets", "Pieces". Match references if possible.
    - response_message_english: Clear summary in English of the action taken.
    - response_message_telugu: Clear summary in Telugu of the action taken.

    User Voice Command: "${text}"

    Respond ONLY with a JSON object of this structure:
    {
      "intent": "UPDATE_STOCK" | "ADD_TO_SHOPPING_LIST",
      "item_english": "Rice",
      "item_telugu": "బియ్యం",
      "quantity": 5.0,
      "unit": "Kg",
      "response_message_english": "...",
      "response_message_telugu": "..."
    }
  `;

  try {
    const resultText = await callLLM(prompt, true);
    console.log('[Coordinator Agent] LLM Response:', resultText);
    const parsedData = JSON.parse(resultText);
    return await executeAction(parsedData);
  } catch (error) {
    console.error('[Coordinator Agent] LLM rotation failed, using rule parser fallback:', error.message);
    const parsedData = localRuleParser(text);
    return await executeAction(parsedData);
  }
}

// Translate Telugu Item Name to English
export async function translateTeluguToEnglish(teluguName) {
  if (!teluguName) return 'Custom Item';

  for (const [key, val] of Object.entries(VOCABULARY)) {
    if (teluguName.trim() === key) {
      console.log(`[Translation Agent] Found dictionary translation for ${teluguName} -> ${val}`);
      return val;
    }
  }

  try {
    const prompt = `Translate this Telugu grocery/kitchen item name to a single, simple English word (e.g. 'Rice', 'Sugar', 'Onions', 'Clarified Butter'). Respond ONLY with the translated word, do not include punctuation, explanations, or quotes.
    Telugu word: "${teluguName}"`;
    
    const translation = await callLLM(prompt, false);
    const englishName = translation.trim().replace(/["'./]/g, '');
    console.log(`[Translation Agent] Rotating LLM translation: ${teluguName} -> ${englishName}`);
    return englishName;
  } catch (error) {
    console.error('[Translation Agent] Translation call failed, returning Telugu name as fallback:', error.message);
    return teluguName; 
  }
}

// OCR Receipt Scanner using rotating Gemini API
export async function scanBillAndPopulate(base64Image, mimeType, billDate) {
  const prompt = `
    You are an expert grocery receipt parser. Analyze this image of a handwritten or printed list of groceries (which may contain text in Telugu and English, quantities, and prices).
    
    Extract all purchased items. For each item, map to clean values:
    - english_name: Clean English name (e.g. 'Rice', 'Toor Dal', 'Sugar', 'Tamarind', 'Sunflower Oil', 'Soap', 'Garlic', 'Exo Soap')
    - telugu_name: Matching Telugu name if written (e.g. 'బియ్యం', 'కందిపప్పు', 'చక్కెర', 'చింతపండు', 'నూనె', 'సబ్బులు', 'తెల్లగడ్డలు')
    - quantity: The numerical quantity bought (as a number, e.g. 3, 0.5)
    - unit: The standard unit ('Kg', 'g', 'L', 'ml', 'Packets (1L)', 'Packets', 'Pieces')
    - price_per_unit: Price per unit (as a number). If only total price and quantity are shown, calculate price_per_unit = total_price / quantity.
    - total_price: Total cost paid for this item (as a number, e.g. 132.0, 340.0)

    Format your output strictly as a JSON array of objects:
    [
      { "english_name": "Sugar", "telugu_name": "చక్కెర", "quantity": 3, "unit": "Kg", "price_per_unit": 44, "total_price": 132 }
    ]
  `;

  try {
    const resultText = await callLLMWithImage(prompt, base64Image, mimeType);
    console.log('[OCR Agent] Gemini Bill Parsing Result:', resultText);
    const parsedItems = JSON.parse(resultText);

    // Populate database with OCR transactions
    const addedTransactions = [];
    
    for (const data of parsedItems) {
      const { english_name, telugu_name, quantity, unit, price_per_unit, total_price } = data;
      if (!english_name || quantity === undefined || total_price === undefined) continue;

      // 1. Get or create item in the database
      let item = await db.get(
        "SELECT * FROM items WHERE LOWER(english_name) = ? OR LOWER(telugu_name) = ?",
        [english_name.toLowerCase(), (telugu_name || english_name).toLowerCase()]
      );

      if (!item) {
        const category = getCategoryFromItem(english_name);
        const defaultThreshold = getDefaultThreshold(unit);
        
        const result = await db.run(
          "INSERT INTO items (english_name, telugu_name, quantity, unit, threshold, category, price) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [english_name, telugu_name || english_name, quantity, unit, defaultThreshold, category, price_per_unit || 0]
        );
        item = await db.get("SELECT * FROM items WHERE id = ?", [result.lastID]);
      } else {
        // Increment quantity in inventory and update latest price
        const newQty = item.quantity + quantity;
        await db.run(
          "UPDATE items SET quantity = ?, price = ? WHERE id = ?",
          [newQty, price_per_unit || item.price, item.id]
        );
      }

      // 2. Insert into purchase_history
      const today = billDate ? new Date(billDate).toISOString() : new Date().toISOString();
      await db.run(
        `INSERT INTO purchase_history (item_id, quantity, price_per_unit, total_price, purchase_date) 
         VALUES (?, ?, ?, ?, ?)`,
        [item.id, quantity, price_per_unit || item.price, total_price, today]
      );

      // 3. Clear from shopping list if present
      await db.run("DELETE FROM shopping_list WHERE item_id = ?", [item.id]);

      addedTransactions.push({
        english_name,
        telugu_name: telugu_name || english_name,
        quantity,
        unit,
        total_price
      });
    }

    const updatedInventory = await db.all("SELECT * FROM items");
    const updatedShoppingList = await db.all(`
      SELECT sl.*, i.english_name, i.telugu_name, i.unit, i.category, i.price
      FROM shopping_list sl
      JOIN items i ON sl.item_id = i.id
      WHERE sl.status = 'pending'
    `);

    return {
      success: true,
      message_english: `Successfully processed receipt and imported ${addedTransactions.length} items!`,
      message_telugu: `బిల్లును విజయవంతంగా స్కాన్ చేసి ${addedTransactions.length} సరుకులను అప్‌డేట్ చేసాము!`,
      items: addedTransactions,
      inventory: updatedInventory,
      shoppingList: updatedShoppingList
    };

  } catch (error) {
    console.error('[OCR Agent] Receipt processing failed:', error);
    return {
      success: false,
      message_english: `Failed to parse bill receipt: ${error.message}`,
      message_telugu: `బిల్లును స్కాన్ చేయడంలో విఫలమైంది: ${error.message}`
    };
  }
}

// Execute action on SQLite
async function executeAction(data) {
  const { intent, item_english, item_telugu, quantity, unit } = data;
  const englishName = item_english || 'Custom Item';
  const teluguName = item_telugu || englishName;
  console.log('[Inventory Agent] Executing action:', { intent, item_english: englishName, item_telugu: teluguName, quantity, unit });

  try {
    let item = await db.get(
      "SELECT * FROM items WHERE LOWER(english_name) = ? OR LOWER(telugu_name) = ?",
      [englishName.toLowerCase(), teluguName.toLowerCase()]
    );

    if (!item) {
      const category = getCategoryFromItem(englishName);
      const defaultThreshold = getDefaultThreshold(unit);
      const defaultPrice = getDefaultPrice(englishName);

      const result = await db.run(
        "INSERT INTO items (english_name, telugu_name, quantity, unit, threshold, category, price) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [englishName, teluguName, intent === 'UPDATE_STOCK' ? quantity : 0, unit, defaultThreshold, category, defaultPrice]
      );
      item = await db.get("SELECT * FROM items WHERE id = ?", [result.lastID]);
    }

    if (intent === 'UPDATE_STOCK') {
      await db.run("UPDATE items SET quantity = ? WHERE id = ?", [quantity, item.id]);
      
      if (quantity < item.threshold) {
        const neededQty = item.threshold - quantity;
        await db.run(
          "INSERT OR IGNORE INTO shopping_list (item_id, quantity) VALUES (?, ?)",
          [item.id, neededQty]
        );
      } else {
        await db.run("DELETE FROM shopping_list WHERE item_id = ? AND status = 'pending'", [item.id]);
      }
    } else if (intent === 'ADD_TO_SHOPPING_LIST') {
      await db.run(
        "INSERT INTO shopping_list (item_id, quantity) VALUES (?, ?) ON CONFLICT(item_id) DO UPDATE SET quantity = quantity + ?",
        [item.id, quantity, quantity]
      );
    }

    const updatedInventory = await db.all("SELECT * FROM items");
    const updatedShoppingList = await db.all(`
      SELECT sl.*, i.english_name, i.telugu_name, i.unit, i.category, i.price
      FROM shopping_list sl
      JOIN items i ON sl.item_id = i.id
      WHERE sl.status = 'pending'
    `);

    let msgEnglish = data.response_message_english || '';
    let msgTelugu = data.response_message_telugu || '';

    // If Telugu message is missing, empty, placeholders, or does not contain Telugu Unicode range characters, generate it programmatically
    const teluguUnicodeRegex = /[\u0c00-\u0c7f]/;
    if (!msgTelugu || msgTelugu.trim() === '...' || !teluguUnicodeRegex.test(msgTelugu)) {
      console.log('[Inventory Agent] Generating fallback Telugu message programmatically');
      const itemDisplayName = item.telugu_name || item_telugu || teluguName || englishName;
      if (intent === 'UPDATE_STOCK') {
        if (quantity === 0) {
          msgTelugu = `${itemDisplayName} అయిపోయింది, స్టాక్ 0 గా మార్చబడింది.`;
          msgEnglish = `Set stock of ${englishName} to 0. It is marked as finished.`;
        } else {
          msgTelugu = `${itemDisplayName} నిల్వను ${quantity} ${unit} కి అప్‌డేట్ చేసాము.`;
          msgEnglish = `Updated ${englishName} stock to ${quantity} ${unit}.`;
        }
      } else {
        msgTelugu = `షాపింగ్ లిస్ట్‌కు ${quantity} ${unit} ${itemDisplayName} జోడించాము.`;
        msgEnglish = `Added ${quantity} ${unit} of ${englishName} to shopping list.`;
      }
    }

    return {
      success: true,
      message_english: msgEnglish,
      message_telugu: msgTelugu,
      parsed: data,
      inventory: updatedInventory,
      shoppingList: updatedShoppingList
    };

  } catch (error) {
    console.error('[Inventory Agent] Action execution error:', error);
    return {
      success: false,
      message_english: `Error executing command: ${error.message}`,
      message_telugu: `ఆదేశాన్ని అమలు చేయడంలో లోపం: ${error.message}`,
      parsed: data
    };
  }
}

function getCategoryFromItem(name) {
  const n = name.toLowerCase();
  if (n.includes('rice') || n.includes('dal') || n.includes('biyyam') || n.includes('pappu') || n.includes('wheat') || n.includes('flour') || n.includes('ravva') || n.includes('రవ్వ')) return 'Grains';
  if (n.includes('oil') || n.includes('nune') || n.includes('నూనె')) return 'Oils';
  if (n.includes('sugar') || n.includes('jaggery') || n.includes('honey') || n.includes('panchadara') || n.includes('చక్కెర') || n.includes('బెల్లం')) return 'Sweeteners';
  if (n.includes('milk') || n.includes('curd') || n.includes('butter') || n.includes('cheese') || n.includes('yogurt') || n.includes('ghee') || n.includes('neyyi') || n.includes('perugu') || n.includes('paalu') || n.includes('పాలు') || n.includes('వెన్న') || n.includes('నెయ్యి') || n.includes('చీజ్')) return 'Dairy';
  if (n.includes('maggi') || n.includes('horlicks') || n.includes('biscuit') || n.includes('chips')) return 'Snacks';
  if (n.includes('exo') || n.includes('vim') || n.includes('dish') || n.includes('washing') || n.includes('detergent') || n.includes('utensil')) return 'Groceries';
  if (n.includes('colgate') || n.includes('paste') || n.includes('soap') || n.includes('shampoo') || n.includes('సబ్బు')) return 'Personal Care';
  if (n.includes('onion') || n.includes('potato') || n.includes('tomato') || n.includes('vegetable') || n.includes('వెల్లుల్లి') || n.includes('ఉల్లిపాయ')) return 'Vegetables';
  return 'Groceries';
}

function getDefaultThreshold(unit) {
  if (unit === 'Kg') return 2.0;
  if (unit === 'L') return 1.0;
  if (unit === 'Packets (1L)') return 2.0;
  if (unit === 'Packets') return 2.0;
  if (unit === 'Pieces') return 1.0;
  return 1.0;
}

function getDefaultPrice(name) {
  const n = name.toLowerCase();
  if (n.includes('rice')) return 60.0;
  if (n.includes('sugar') || n.includes('చక్కెర')) return 44.0;
  if (n.includes('oil') || n.includes('నూనె')) return 150.0;
  if (n.includes('dal') || n.includes('కందిపప్పు')) return 170.0;
  if (n.includes('milk') || n.includes('పాలు')) return 60.0;
  if (n.includes('curd') || n.includes('perugu') || n.includes('పెరుగు')) return 30.0;
  if (n.includes('butter') || n.includes('venna') || n.includes('వెన్న')) return 50.0;
  if (n.includes('ghee') || n.includes('neyyi') || n.includes('నెయ్యి')) return 350.0;
  if (n.includes('cheese') || n.includes('చీజ్')) return 120.0;
  if (n.includes('maggi')) return 14.0;
  if (n.includes('horlicks')) return 320.0;
  if (n.includes('colgate')) return 90.0;
  return 50.0;
}

export async function getPurchaseRecommendations() {
  try {
    const historyQuery = `
      SELECT ph.item_id, i.english_name, i.telugu_name, i.unit, AVG(ph.quantity) as avg_qty, COUNT(ph.id) as frequency
      FROM purchase_history ph
      JOIN items i ON ph.item_id = i.id
      GROUP BY ph.item_id
      HAVING frequency >= 2
    `;
    const recommendations = await db.all(historyQuery);
    
    return recommendations.map(rec => ({
      itemId: rec.item_id,
      englishName: rec.english_name,
      teluguName: rec.telugu_name,
      unit: rec.unit,
      suggestedQuantity: Math.round(rec.avg_qty * 10) / 10,
      reason_english: `Based on your average consumption over the last ${rec.frequency} months.`,
      reason_telugu: `గత ${rec.frequency} నెలలలో మీ సగటు వినియోగం ఆధారంగా.`
    }));
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return [];
  }
}

// Translate English/Transliterated Item Name to Telugu Script
export async function translateEnglishToTelugu(englishName) {
  if (!englishName) return '';

  const nameLower = englishName.trim().toLowerCase();

  // 1. Check local dictionary mapping (translates English/transliterated Telugu to standard English first, then to Telugu script)
  const standardEnglish = VOCABULARY[nameLower];
  if (standardEnglish) {
    const teluguScript = Object.keys(VOCABULARY).find(key => 
      VOCABULARY[key] === standardEnglish && /[\u0c00-\u0c7f]/.test(key)
    );
    if (teluguScript) {
      console.log(`[Translation Agent] Found dictionary translation for ${englishName} -> ${teluguScript}`);
      return teluguScript;
    }
  }

  // 2. Fallback to LLM translation
  try {
    const prompt = `Translate or transliterate this English name or transliterated Telugu kitchen item name to proper Telugu script (e.g. 'Jaggery' or 'bellam' to 'బెల్లం', 'Rice' or 'biyyam' to 'బియ్యం', 'Garlic' to 'వెల్లుల్లి', 'Onions' to 'ఉల్లిపాయలు'). Respond ONLY with the Telugu script word, do not include punctuation, explanations, or quotes.
    Word: "${englishName}"`;
    
    const translation = await callLLM(prompt, false);
    const teluguName = translation.trim().replace(/["'./]/g, '');
    console.log(`[Translation Agent] Rotating LLM translation: ${englishName} -> ${teluguName}`);
    return teluguName;
  } catch (error) {
    console.error('[Translation Agent] Translation call failed, returning original name:', error.message);
    return englishName;
  }
}

