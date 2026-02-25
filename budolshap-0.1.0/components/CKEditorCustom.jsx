'use client'
import React, { useEffect, useState } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
    ClassicEditor,
    Bold,
    Italic,
    Essentials,
    Paragraph,
    Heading,
    List,
    Link,
    Undo,
    Font,
    Alignment,
    RemoveFormat,
    HorizontalLine
} from 'ckeditor5';

import 'ckeditor5/ckeditor5.css';

const CKEditorCustom = ({ value, onChange, placeholder }) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return <div className="min-h-48 border border-slate-200 rounded bg-white flex items-center justify-center"><p className="text-slate-400">Loading editor...</p></div>;

    return (
        <div className="ck-editor-wrapper">
            <CKEditor
                editor={ClassicEditor}
                config={{
                    licenseKey: 'GPL', // Required for CKEditor 5 v42+ for open-source usage
                    plugins: [
                        Essentials, Bold, Italic, Paragraph, Heading, List, Link, Undo,
                        Font, Alignment, RemoveFormat, HorizontalLine
                    ],
                    toolbar: [
                        'undo', 'redo', '|',
                        'heading', '|',
                        'bold', 'italic', 'fontSize', 'fontColor', 'fontBackgroundColor', '|',
                        'link', 'bulletedList', 'numberedList', '|',
                        'alignment', 'removeFormat', 'horizontalLine'
                    ],
                    placeholder: placeholder || 'Enter description...',
                }}
                data={value || ''}
                onChange={(event, editor) => {
                    const data = editor.getData();
                    onChange(data);
                }}
            />
            <style jsx global>{`
                .ck-editor__editable_inline {
                    min-height: 200px;
                }
            `}</style>
        </div>
    );
};

export default CKEditorCustom;
