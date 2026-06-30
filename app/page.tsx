"use client";

import { useState, useRef } from 'react';
import { UploadCloud, Shirt, Loader2, Sparkles, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { client, handle_file } from '@gradio/client'; // <-- Yapay zekayı Vercel'den değil, tarayıcıdan çağırıyoruz

export default function Home() {
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [garmentImage, setGarmentImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const personInputRef = useRef<HTMLInputElement>(null);
  const garmentInputRef = useRef<HTMLInputElement>(null);

  const uploadToSupabase = async (file: File, type: string) => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage.from('vton-images').upload(fileName, file);
      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from('vton-images').getPublicUrl(fileName);
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Yükleme hatası:', error);
      alert('Resim yüklenirken bir hata oluştu.');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePersonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = await uploadToSupabase(e.target.files[0], 'person');
      if (url) {
        setPersonImage(url);
        setResultImage(null);
      }
    }
  };

  const handleGarmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = await uploadToSupabase(e.target.files[0], 'garment');
      if (url) {
        setGarmentImage(url);
        setResultImage(null);
      }
    }
  };

  // VERCEL ENGELİNİ AŞAN YENİ YAPAY ZEKA FONKSİYONU
  const handleGenerate = async () => {
    if (!personImage || !garmentImage) return;
    
    setIsGenerating(true);
    try {
      // Doğrudan kullanıcının tarayıcısı üzerinden bağlanıyoruz (Süre sınırı yok!)
      const hfClient = await client("Nymbo/Virtual-Try-On");
      
      const result = await hfClient.predict("/tryon", [
        handle_file(personImage),   
        handle_file(garmentImage),  
        "a photo of a person wearing the garment, high quality, photorealistic", 
        true,  
        true,  
        30,    
        42     
      ]);

      // @ts-ignore
      const outputUrl = result.data[0].url;
      setResultImage(outputUrl);
      
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 500);
      
    } catch (error) {
      console.error("AI Hatası:", error);
      alert('Hugging Face sunucusu şu an çok yoğun. Lütfen 1-2 dakika sonra tekrar deneyin.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!resultImage) return;
    try {
      const response = await fetch(resultImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vton-sonuc-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('İndirme hatası:', error);
      alert('Resim indirilirken bir sorun oluştu.');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8 flex flex-col items-center py-20">
      <div className="max-w-4xl w-full">
        
        <header className="mb-12 text-center">
          <h1 className="text-6xl font-black text-gray-900 mb-4 tracking-tighter uppercase">VTON</h1>
          <p className="text-lg text-gray-600">Fotoğrafını ve kıyafetini yükle, yapay zeka ile anında üzerinde gör.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div onClick={() => personInputRef.current?.click()} className="bg-white p-2 rounded-[2rem] shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center hover:border-black transition-all cursor-pointer min-h-[320px] relative">
            <input type="file" accept="image/*" className="hidden" ref={personInputRef} onChange={handlePersonUpload} disabled={isUploading || isGenerating} />
            {personImage ? (
              <img src={personImage} alt="Kişi" className="w-full h-full object-cover rounded-[1.8rem]" />
            ) : (
              <div className="p-8 flex flex-col items-center">
                <div className="bg-gray-100 p-4 rounded-full mb-4"><UploadCloud className="w-8 h-8 text-gray-800" /></div>
                <h3 className="text-xl font-bold">Kişi Fotoğrafı</h3>
              </div>
            )}
          </div>

          <div onClick={() => garmentInputRef.current?.click()} className="bg-white p-2 rounded-[2rem] shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center hover:border-black transition-all cursor-pointer min-h-[320px] relative">
            <input type="file" accept="image/*" className="hidden" ref={garmentInputRef} onChange={handleGarmentUpload} disabled={isUploading || isGenerating} />
            {garmentImage ? (
              <img src={garmentImage} alt="Kıyafet" className="w-full h-full object-cover rounded-[1.8rem]" />
            ) : (
              <div className="p-8 flex flex-col items-center">
                <div className="bg-gray-100 p-4 rounded-full mb-4"><Shirt className="w-8 h-8 text-gray-800" /></div>
                <h3 className="text-xl font-bold">Kıyafet Fotoğrafı</h3>
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center">
          {isUploading && <div className="text-gray-500 mb-4 animate-pulse">Resimler yükleniyor...</div>}
          
          <button 
            onClick={handleGenerate}
            disabled={Boolean(!personImage || !garmentImage || isUploading || isGenerating)}
            className="bg-black text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-800 disabled:bg-gray-300 transition-colors shadow-lg flex items-center gap-2"
          >
            {isGenerating ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Yapay Zeka İşliyor (30-60sn)...</>
            ) : (
              <><Sparkles className="w-5 h-5" /> Üzerimde Göster</>
            )}
          </button>
        </div>

        {resultImage && (
          <div className="mt-16 bg-white p-6 rounded-[2rem] shadow-xl border border-gray-200 animate-in fade-in slide-in-from-bottom-8 duration-700 flex flex-col items-center">
            <h2 className="text-3xl font-black text-center mb-6 mt-2">İşte Sonuç</h2>
            <img src={resultImage} alt="VTON Sonuç" className="w-full max-w-2xl h-auto rounded-[1.5rem] shadow-sm mb-6" />
            
            <button 
              onClick={handleDownload}
              className="bg-gray-100 text-gray-900 px-8 py-3 rounded-full font-bold text-md hover:bg-gray-200 transition-colors border border-gray-300 shadow-sm flex items-center gap-2"
            >
              <Download className="w-5 h-5" /> Sonucu İndir
            </button>
          </div>
        )}

      </div>
    </main>
  );
}