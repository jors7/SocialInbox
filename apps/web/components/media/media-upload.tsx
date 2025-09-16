import { useRef } from 'react';

interface MediaUploadProps {
  onUpload: (files: FileList) => void;
  disabled?: boolean;
  accept?: string;
  multiple?: boolean;
  children: React.ReactNode;
}

export function MediaUpload({
  onUpload,
  disabled = false,
  accept = "image/*,video/*,.pdf,.doc,.docx",
  multiple = true,
  children,
}: MediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onUpload(files);
      // Reset input so the same file can be selected again
      e.target.value = '';
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />
      <div onClick={handleClick}>
        {children}
      </div>
    </>
  );
}