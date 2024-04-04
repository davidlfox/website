'use client';

import React, { useRef, useState } from 'react';
import Text from './Text';
import ExportedImage from 'next-image-export-optimizer';
import ButtonWhite from './ButtonWhite';
import { uploadFileToIPFS } from '@utils/uploadFileToIPFS';
import clsx from 'clsx';
import GlowWrapper from './GlowWrapper';
import Spinner from './Spinner';
import { Tooltip } from 'react-tooltip';
import toast, { Toaster } from 'react-hot-toast';

const MAX_FILE_SIZE_MB = 50;

const getImageAsFile = async (imageUrl: string): Promise<File> => {
  const response = await fetch(imageUrl);
  const data = await response.blob();
  return new File([data], "test-image.png", { type: "image/png" });
}

const getTitle = ({ loading, uploaded }: { loading: boolean, uploaded: boolean }) => {
  if (loading) return 'PROCESSING';
  if (uploaded) return 'SUCCESSFUL';
  return 'FILE UPLOAD';
};

type Nullable<T> = T | null;

const FileUpload: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [upload, setUpload] = useState<Nullable<{ file: File; cid: string }>>();

  const uploadTestFile = async () => {
    const content = await getImageAsFile('/images/test-image.png');
    await uploadToIPFS(content);
  }

  const uploadToIPFS = async (file: File) => {
    const fileToUpload = {
      content: file,
      path: file.name,
    };

    // If file is over 50Mb, don't upload
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`File is too large. Please upload a file under ${MAX_FILE_SIZE_MB}Mb.`);
      reset();
      return;
    }

    setLoading(true);
    const fileCID = await uploadFileToIPFS(fileToUpload);
    setLoading(false);

    if (!fileCID) {
      toast.error('Oops! Something went wrong.');
      reset(); // TODO: Handle error
    } else {
      setUpload({ file, cid: fileCID });
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    const [droppedFile] = e.dataTransfer.files;
    uploadToIPFS(droppedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      uploadToIPFS(e.target.files[0]);
    }
  };

  const handleClick = () => {
    if (loading) return;
    if (upload?.cid) return;
    fileInputRef.current?.click();
  };

  const copyToClipboard = () => {
    if (!upload?.cid) return;
    navigator.clipboard.writeText(`https://ipfs.io/ipfs/${upload.cid}`);
    // TODO: Success copy tooltip
  };

  const reset = () => {
    setUpload(null);
    setLoading(false);
  };

  return (
    <GlowWrapper className='w-full' hidden={!!upload}>
      <div
        className={clsx("flex flex-col h-full w-full rounded-5 border-1 border-dashed border-ui-light-grey shadow-dark backdrop-blur-[6px] bg-glass relative")}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Toaster
          position='bottom-center'
          toastOptions={{
            // Define default options
            className: '',
            duration: 5000,
            style: {
              background: '#151718',
              color: '#f1f1f1',
            }
          }}
        />
        {upload?.file && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={URL.createObjectURL(upload?.file)}
            className="object-contain h-full w-full rounded-5 absolute -z-1"
            alt="Uploaded Image"
          />
        )}
        <input 
          type="file" 
          multiple 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
        />
        <div className="flex justify-between items-center p-10 pl-20 relative self-stretch">
          <div className="absolute top-[0.75rem] left-10 flex gap-[0.625rem]">
            <div className="rounded-full border-1 border-ui-light-grey h-10 w-10 opacity-40" />
            <div className="rounded-full border-1 border-ui-light-grey h-10 w-10 opacity-40" />
            <div className="rounded-full border-1 border-ui-light-grey h-10 w-10 opacity-40" />
          </div>
          <Text style="caption-s" className="text-center w-full">
            {getTitle({ loading, uploaded: !!upload })}
          </Text>
          <ExportedImage
            src="/svg/bolt-white.svg"
            className="w-full max-w-[1rem] opacity-40"
            alt="Arrow Down"
            width={12}
            height={24}
          />
        </div>

        <div className={clsx("flex flex-col items-center gap-25 h-full p-15 shadow-dark", {
          'justify-center': !upload?.cid,
          'justify-end': !!upload?.cid,
        })}>
          {loading && <Spinner className='mb-16'/>}
          {!upload && !loading && (
            <>
              <Text className="whitespace-pre text-center" style="s">{dragging ? 'Drop your files here!' : `Drag & drop your image here \n to test our performance`}</Text>
              <div className='flex flex-col items-center gap-15'>
                <ButtonWhite onClick={handleClick} className="w-full">UPLOAD IMAGE</ButtonWhite>
                <div onClick={uploadTestFile}>
                  <Text style="caption-xs" className='text-ui-light-grey cursor-pointer'>USE A TEST FILE</Text>
                </div>
              </div>
            </>
          )}
          {upload?.cid && (
            <div className='flex items-center justify-end w-fit p-8 pl-24 gap-16 bg-ui-fleek-black rounded-12'>
              <Text style='s' className='text-ui-light-grey'>{`https://ipfs.io/ipfs/${upload.cid.slice(0, 15)}...`}</Text>
                <Tooltip openOnClick id="copy-tooltip" place="top" content="Copied!" className='rounded-32 p-8 bg-ui-fleek-black'/>
                <ExportedImage
                  src="/svg/copy-icon.svg"
                  className="w-full max-w-[16px] opacity-60 cursor-pointer active:opacity-100 hover:opacity-80"
                  alt="Copy"
                  width={16}
                  height={16}
                  onClick={copyToClipboard}
                  data-tooltip-id="copy-tooltip"
                />
              <ExportedImage
                src="/svg/close-icon.svg"
                className="w-full max-w-[16px] opacity-60 cursor-pointer active:opacity-100 hover:opacity-80"
                alt="Copy"
                width={24}
                height={24}
                onClick={reset}
              />
            </div>
          )}
        </div>
      </div>
    </GlowWrapper>
  );
};

export default FileUpload;