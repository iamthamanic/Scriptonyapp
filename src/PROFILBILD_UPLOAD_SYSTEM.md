# 📸 Profilbild Upload System - Wiederverwendbare Dokumentation

## 🎯 **ÜBERBLICK**

Ein vollständiges, wiederverwendbares System für **Profilbild-Upload mit Crop-Funktionalität** für React/TypeScript-Anwendungen.

**Features:**
- ✅ Bild-Upload über versteckten File-Input
- ✅ Base64-Konvertierung (sofort nutzbar, keine Serverabhängigkeit)
- ✅ Crop & Zoom Dialog (runder Crop für Profilbilder)
- ✅ Preview-Anzeige mit Hover-Effekt
- ✅ Responsive & Mobile-optimiert
- ✅ Camera-Icon als Upload-Trigger

---

## 📦 **BENÖTIGTE DEPENDENCIES**

```bash
npm install react-easy-crop@5.0.8
```

**Zusätzlich benötigt:**
- ShadCN UI Komponenten: `Dialog`, `Button`, `Slider`
- Lucide Icons: `Camera`, `User`, `ZoomIn`, `ZoomOut`, `X`

---

## 🏗️ **ARCHITEKTUR & KOMPONENTEN**

### **1. ImageCropDialog Component** (`/components/ImageCropDialog.tsx`)

Die zentrale Crop-Dialog-Komponente.

```tsx
import { useState, useCallback } from "react";
import Cropper from "react-easy-crop@5.0.8";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { ZoomIn, ZoomOut } from "lucide-react";

interface ImageCropDialogProps {
  image: string;
  onComplete: (croppedImage: string) => void;
  onCancel: () => void;
}

export function ImageCropDialog({ image, onComplete, onCancel }: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async () => {
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onComplete(croppedImage);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Profilbild bearbeiten</DialogTitle>
          <DialogDescription>
            Verschiebe und zoome das Bild, um den gewünschten Ausschnitt festzulegen.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Crop Area */}
          <div className="relative w-full aspect-square bg-black/5 dark:bg-white/5 rounded-lg overflow-hidden">
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          {/* Zoom Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ZoomOut className="size-4" />
                Zoom
              </span>
              <ZoomIn className="size-4" />
            </div>
            <Slider
              value={[zoom]}
              onValueChange={(value) => setZoom(value[0])}
              min={1}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel} className="h-11">
            Abbrechen
          </Button>
          <Button onClick={createCroppedImage} className="h-11">
            Übernehmen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to create cropped image
async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  // Set canvas size to match the cropped area
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Return as base64
  return canvas.toDataURL("image/jpeg", 0.95);
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });
}
```

---

### **2. Verwendung in Parent Component**

#### **A) State Setup**

```tsx
import { useState, useRef } from "react";
import { Camera, User } from "lucide-react";
import { ImageCropDialog } from "./ImageCropDialog";

// Character Interface (Beispiel)
interface Character {
  id: string;
  name: string;
  image?: string;
  // ... weitere Felder
}

function CharacterCard({ character, onImageUpload }: {
  character: Character;
  onImageUpload: (characterId: string, imageUrl: string) => void;
}) {
  // Refs für File Input
  const characterImageInputRef = useRef<HTMLInputElement>(null);
  
  // States für Crop Dialog
  const [tempImageForCrop, setTempImageForCrop] = useState<string | undefined>(undefined);
  const [showImageCropDialog, setShowImageCropDialog] = useState(false);
  
  // ... weitere States
}
```

#### **B) Handler Functions**

```tsx
// Trigger File Input
const handleImageClick = () => {
  characterImageInputRef.current?.click();
};

// File Selected → Base64 + Show Crop Dialog
const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      setTempImageForCrop(reader.result as string);
      setShowImageCropDialog(true);
    };
    reader.readAsDataURL(file);
  }
};

// Cropped Image → Save to State
const handleCroppedImage = (croppedImage: string) => {
  onImageUpload(character.id, croppedImage);
  setShowImageCropDialog(false);
  setTempImageForCrop(undefined);
};
```

#### **C) UI Implementation - Bearbeitungsmodus**

```tsx
return (
  <div>
    {/* Profile Image - Edit Mode */}
    {character.image ? (
      <button 
        onClick={handleImageClick}
        className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-character-blue-light hover:border-character-blue transition-colors cursor-pointer group"
      >
        <img src={character.image} alt={character.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera className="size-5 text-white" />
        </div>
      </button>
    ) : (
      <button 
        onClick={handleImageClick}
        className="w-16 h-16 rounded-full border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-center bg-muted/10"
      >
        <Camera className="size-6 text-muted-foreground" />
      </button>
    )}
    
    {/* Hidden File Input */}
    <input
      ref={characterImageInputRef}
      type="file"
      accept="image/*"
      onChange={handleImageChange}
      className="hidden"
    />
    
    {/* Crop Dialog */}
    {showImageCropDialog && tempImageForCrop && (
      <ImageCropDialog
        image={tempImageForCrop}
        onComplete={handleCroppedImage}
        onCancel={() => {
          setShowImageCropDialog(false);
          setTempImageForCrop(undefined);
        }}
      />
    )}
  </div>
);
```

#### **D) UI Implementation - Ansichtsmodus (Nur Display)**

```tsx
{character.image ? (
  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-character-blue-light">
    <img src={character.image} alt={character.name} className="w-full h-full object-cover" />
  </div>
) : (
  <div className="w-16 h-16 rounded-full border-2 border-character-blue-light flex items-center justify-center bg-muted/10">
    <User className="size-8 text-muted-foreground" />
  </div>
)}
```

#### **E) UI Implementation - New Character Dialog**

```tsx
<Dialog open={showNewCharacter} onOpenChange={setShowNewCharacter}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Neuer Charakter</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4">
      {/* Image Upload - First */}
      <div className="space-y-2">
        <Label>Profilbild (Optional)</Label>
        {newCharacterImage ? (
          <div className="relative w-32 h-32 mx-auto">
            <img 
              src={newCharacterImage} 
              alt="Preview" 
              className="w-full h-full object-cover rounded-full border-4 border-character-blue-light" 
            />
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setNewCharacterImage(undefined)}
              className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0"
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <button 
            onClick={() => newCharacterImageInputRef.current?.click()}
            className="w-32 h-32 mx-auto border-2 border-dashed border-border rounded-full text-center hover:border-primary/50 transition-colors active:scale-[0.98] cursor-pointer flex flex-col items-center justify-center bg-muted/10"
          >
            <Camera className="size-8 mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Bild hochladen</p>
          </button>
        )}
        <input
          ref={newCharacterImageInputRef}
          type="file"
          accept="image/*"
          onChange={handleNewCharacterImageChange}
          className="hidden"
        />
      </div>
      
      {/* Name Input */}
      <div className="space-y-2">
        <Label>Name *</Label>
        <Input 
          value={newCharacterName}
          onChange={(e) => setNewCharacterName(e.target.value)}
          placeholder="z.B. Sarah Chen"
        />
      </div>
      
      {/* ... weitere Felder */}
    </div>
    
    <DialogFooter>
      <Button onClick={handleCreateCharacter}>
        Erstellen
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 🔄 **DATENFLUSS**

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERAKTION                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  1. User klickt auf Camera-Icon / Upload-Button             │
│     → characterImageInputRef.current?.click()               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. File Input öffnet sich (hidden Input)                   │
│     <input type="file" accept="image/*" />                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. User wählt Bild aus                                     │
│     → handleImageChange(e) wird ausgelöst                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4. FileReader konvertiert zu Base64                        │
│     const reader = new FileReader();                        │
│     reader.readAsDataURL(file);                             │
│     → reader.onloadend = () => {                            │
│         setTempImageForCrop(reader.result as string);       │
│         setShowImageCropDialog(true);                       │
│       }                                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  5. ImageCropDialog öffnet sich                             │
│     <ImageCropDialog                                        │
│       image={tempImageForCrop}                              │
│       onComplete={handleCroppedImage}                       │
│       onCancel={...}                                        │
│     />                                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  6. User croppt & zoomt Bild                                │
│     → react-easy-crop library                               │
│     → Zoom Slider (1x - 3x)                                 │
│     → Crop Position (x, y)                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  7. User klickt "Übernehmen"                                │
│     → createCroppedImage()                                  │
│     → getCroppedImg(image, croppedAreaPixels)               │
│     → Canvas API erstellt cropped Base64                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  8. onComplete wird aufgerufen                              │
│     → handleCroppedImage(croppedImage)                      │
│     → onImageUpload(character.id, croppedImage)             │
│     → State wird aktualisiert                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  9. Dialog schließt sich                                    │
│     setShowImageCropDialog(false);                          │
│     setTempImageForCrop(undefined);                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  10. Neues Bild wird angezeigt                              │
│      <img src={character.image} />                          │
│      (Base64 String direkt verwendbar!)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 💾 **DATENPERSISTENZ**

### **Option 1: Lokaler State (Base64)**

```tsx
// Direktes Speichern im State
const [characters, setCharacters] = useState<Character[]>([]);

const updateCharacterImage = (characterId: string, imageUrl: string) => {
  setCharacters(prev => prev.map(character => 
    character.id === characterId 
      ? { ...character, image: imageUrl } 
      : character
  ));
};
```

**Vorteile:**
- ✅ Sofort verfügbar, keine Server-Roundtrips
- ✅ Funktioniert offline
- ✅ Keine zusätzlichen API-Calls nötig

**Nachteile:**
- ❌ Base64 ist größer als binäre Files (~33% Overhead)
- ❌ Kann bei vielen/großen Bildern State aufblähen

---

### **Option 2: Supabase Storage Upload**

```tsx
import { supabase } from "./utils/supabase/client";

const uploadCharacterImage = async (characterId: string, base64Image: string) => {
  try {
    // 1. Convert Base64 to Blob
    const blob = await fetch(base64Image).then(r => r.blob());
    
    // 2. Generate unique filename
    const fileName = `character-${characterId}-${Date.now()}.jpg`;
    
    // 3. Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('character-images')  // Bucket name
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (error) throw error;
    
    // 4. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('character-images')
      .getPublicUrl(fileName);
    
    // 5. Save URL to database
    await supabase
      .from('characters')
      .update({ image: publicUrl })
      .eq('id', characterId);
    
    return publicUrl;
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
};
```

**Bucket Setup (einmalig):**
```tsx
// In Supabase Dashboard oder via Service Role
const { data, error } = await supabase.storage.createBucket('character-images', {
  public: true
});
```

---

### **Option 3: Backend API Upload**

```tsx
// Frontend
const uploadCharacterImage = async (characterId: string, base64Image: string) => {
  const response = await fetch('/api/characters/upload-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      characterId,
      image: base64Image
    })
  });
  
  const { imageUrl } = await response.json();
  return imageUrl;
};

// Backend (z.B. Hono)
app.post('/characters/upload-image', async (c) => {
  const { characterId, image } = await c.req.json();
  
  // Base64 → Blob
  const buffer = Buffer.from(image.split(',')[1], 'base64');
  
  // Upload to Supabase Storage
  const fileName = `character-${characterId}-${Date.now()}.jpg`;
  const { data, error } = await supabase.storage
    .from('character-images')
    .upload(fileName, buffer, {
      contentType: 'image/jpeg'
    });
  
  if (error) return c.json({ error: error.message }, 500);
  
  const { data: { publicUrl } } = supabase.storage
    .from('character-images')
    .getPublicUrl(fileName);
  
  return c.json({ imageUrl: publicUrl });
});
```

---

## 🎨 **STYLING & VARIANTEN**

### **1. Collapsed View (Kleine Vorschau)**

```tsx
<div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-muted/30 border-2 border-character-blue-light">
  {character.image ? (
    <img src={character.image} alt={character.name} className="w-full h-full object-cover" />
  ) : (
    <div className="w-full h-full flex items-center justify-center">
      <User className="size-6 text-muted-foreground" />
    </div>
  )}
</div>
```

### **2. Expanded View (Große Vorschau mit Hover)**

```tsx
{character.image ? (
  <button 
    onClick={handleImageClick}
    className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-character-blue-light hover:border-character-blue transition-colors cursor-pointer group"
  >
    <img src={character.image} alt={character.name} className="w-full h-full object-cover" />
    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
      <Camera className="size-5 text-white" />
    </div>
  </button>
) : (
  <button 
    onClick={handleImageClick}
    className="w-16 h-16 rounded-full border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-center bg-muted/10"
  >
    <Camera className="size-6 text-muted-foreground" />
  </button>
)}
```

### **3. New Item Dialog (Zentriert mit Preview)**

```tsx
<div className="space-y-2">
  <Label>Profilbild (Optional)</Label>
  {newCharacterImage ? (
    <div className="relative w-32 h-32 mx-auto">
      <img 
        src={newCharacterImage} 
        alt="Preview" 
        className="w-full h-full object-cover rounded-full border-4 border-character-blue-light" 
      />
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setNewCharacterImage(undefined)}
        className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0"
      >
        <X className="size-4" />
      </Button>
    </div>
  ) : (
    <button 
      onClick={() => newCharacterImageInputRef.current?.click()}
      className="w-32 h-32 mx-auto border-2 border-dashed border-border rounded-full hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center bg-muted/10"
    >
      <Camera className="size-8 mb-1 text-muted-foreground" />
      <p className="text-xs text-muted-foreground">Bild hochladen</p>
    </button>
  )}
</div>
```

---

## 🔧 **ANPASSUNGEN & KONFIGURATION**

### **Crop-Shape ändern (Rechteckig statt Rund)**

```tsx
<Cropper
  aspect={16/9}      // 16:9 Format
  cropShape="rect"   // Rechteck statt "round"
  showGrid={true}    // Grid anzeigen
/>
```

### **Bildqualität anpassen**

```tsx
// In getCroppedImg()
return canvas.toDataURL("image/jpeg", 0.95);  // 0.95 = 95% Qualität
//                                    ^^^^^
//                                    0.0 - 1.0
```

### **Bildgröße limitieren**

```tsx
async function getCroppedImg(imageSrc: string, pixelCrop: any, maxWidth = 800): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // Calculate scaled dimensions
  let width = pixelCrop.width;
  let height = pixelCrop.height;
  
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  canvas.width = width;
  canvas.height = height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    width,
    height
  );

  return canvas.toDataURL("image/jpeg", 0.95);
}
```

### **Zoom-Range anpassen**

```tsx
<Slider
  value={[zoom]}
  onValueChange={(value) => setZoom(value[0])}
  min={1}      // Kein Zoom
  max={5}      // 5x Zoom (statt 3x)
  step={0.1}   // Feinere Schritte
/>
```

---

## 🚀 **QUICK START CHECKLIST**

- [ ] **1.** `react-easy-crop@5.0.8` installieren
- [ ] **2.** `ImageCropDialog.tsx` erstellen (siehe oben)
- [ ] **3.** State setup in Parent Component:
  ```tsx
  const [tempImageForCrop, setTempImageForCrop] = useState<string | undefined>();
  const [showImageCropDialog, setShowImageCropDialog] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  ```
- [ ] **4.** Handler functions implementieren:
  - `handleImageClick()`
  - `handleImageChange()`
  - `handleCroppedImage()`
- [ ] **5.** UI implementieren:
  - Camera Button
  - Hidden File Input
  - ImageCropDialog
- [ ] **6.** onImageUpload Callback implementieren
- [ ] **7.** (Optional) Supabase Storage integrieren

---

## 📝 **VERWENDUNGSBEISPIEL - KOMPLETT**

```tsx
import { useState, useRef } from "react";
import { Camera, User, X } from "lucide-react";
import { ImageCropDialog } from "./components/ImageCropDialog";
import { Button } from "./components/ui/button";

interface Profile {
  id: string;
  name: string;
  image?: string;
}

function ProfileCard({ profile }: { profile: Profile }) {
  const [profileData, setProfileData] = useState(profile);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [tempImageForCrop, setTempImageForCrop] = useState<string | undefined>();
  const [showImageCropDialog, setShowImageCropDialog] = useState(false);

  const handleImageClick = () => {
    imageInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImageForCrop(reader.result as string);
        setShowImageCropDialog(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCroppedImage = (croppedImage: string) => {
    setProfileData(prev => ({ ...prev, image: croppedImage }));
    setShowImageCropDialog(false);
    setTempImageForCrop(undefined);
  };

  return (
    <div className="p-4">
      {profileData.image ? (
        <button 
          onClick={handleImageClick}
          className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-primary hover:border-primary/80 transition-colors cursor-pointer group"
        >
          <img src={profileData.image} alt={profileData.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="size-6 text-white" />
          </div>
        </button>
      ) : (
        <button 
          onClick={handleImageClick}
          className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 hover:border-primary transition-colors cursor-pointer flex items-center justify-center bg-gray-50"
        >
          <Camera className="size-8 text-gray-400" />
        </button>
      )}

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
      />

      {showImageCropDialog && tempImageForCrop && (
        <ImageCropDialog
          image={tempImageForCrop}
          onComplete={handleCroppedImage}
          onCancel={() => {
            setShowImageCropDialog(false);
            setTempImageForCrop(undefined);
          }}
        />
      )}
    </div>
  );
}
```

---

## ✅ **FERTIG!**

Du hast jetzt ein **vollständig wiederverwendbares Profilbild-Upload-System** mit:
- ✅ Base64-Konvertierung (sofort nutzbar)
- ✅ Crop & Zoom Funktionalität
- ✅ Responsive Design
- ✅ Hover-Effekte
- ✅ Preview-Anzeige
- ✅ Optional: Supabase Storage Integration

**Kopiere einfach die relevanten Code-Blöcke in dein neues Projekt! 🚀**