import { NextResponse } from 'next/server';
import { client, handle_file } from '@gradio/client';

export async function POST(req: Request) {
  try {
    const { personImage, garmentImage } = await req.json();

    if (!personImage || !garmentImage) {
      return NextResponse.json({ success: false, error: "Resimler eksik." }, { status: 400 });
    }

    // Hugging Face Token'ımızı çekiyoruz
    const hfToken = process.env.HF_TOKEN;

    // Modele bağlanırken token'ı kimlik olarak sunuyoruz
    const hfClient = await client("Nymbo/Virtual-Try-On", {
      hf_token: hfToken
    } as any);

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

    return NextResponse.json({ success: true, resultImage: outputUrl });

  } catch (error: any) {
    console.error("AI Error:", error);
    return NextResponse.json({ success: false, error: "Yapay zeka işleminde hata oluştu veya sunucu meşgul." }, { status: 500 });
  }
}