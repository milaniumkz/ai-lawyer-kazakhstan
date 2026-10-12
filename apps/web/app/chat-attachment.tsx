"use client";
import {useEffect, useState} from 'react';

export function ChatAttachment({file,ownerUserId}:{file:{id?:string;fileName:string;mimeType:string;sizeBytes:number};ownerUserId:string}) {
  const [preview,setPreview]=useState('');
  useEffect(()=>{
    if(!file.id || !/^image\/(jpeg|png|webp)$/.test(file.mimeType)) return;
    const controller=new AbortController(); let url='';
    void fetch(`/api/v1/documents/${file.id}/content`,{headers:{'x-user-id':ownerUserId},signal:controller.signal}).then(async response=>{
      if(!response.ok) return;
      const blob=await response.blob();
      if(controller.signal.aborted) return;
      url=URL.createObjectURL(blob);setPreview(url);
    }).catch(()=>{});
    return ()=>{controller.abort();if(url)URL.revokeObjectURL(url);};
  },[file.id,file.mimeType,ownerUserId]);
  return <div className="aizanChatAttachment">{preview ? <span className="aizanAttachmentPreview" role="img" aria-label={file.fileName} style={{backgroundImage:`url("${preview}")`}} /> : <span className="aizanAttachmentFileIcon" aria-hidden="true">▤</span>}<span><strong>{file.fileName}</strong><small>{file.mimeType==='application/pdf' ? 'PDF' : file.mimeType.startsWith('image/') ? 'Фото' : 'Файл'}{file.sizeBytes ? ` · ${Math.ceil(file.sizeBytes/1024)} КБ` : ''}</small></span></div>;
}
