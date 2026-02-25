
import { isValidImage } from '../lib/imageUtils.js';

describe('isValidImage', () => {
    test('should return true for valid HTTP URLs', () => {
        expect(isValidImage('http://example.com/image.jpg')).toBe(true);
    });

    test('should return true for valid HTTPS URLs', () => {
        expect(isValidImage('https://example.com/image.png')).toBe(true);
    });

    test('should return true for base64 data URIs with valid MIME types', () => {
        expect(isValidImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=')).toBe(true);
        expect(isValidImage('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9sAQwAHBwcIBwgLCwoLDg4ODhIODg4OFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhb/2gAMAwEAAhEDEQA/AP/Z')).toBe(true);
        expect(isValidImage('data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA')).toBe(true);
    });

    test('should return false for base64 data URIs with invalid MIME types', () => {
        expect(isValidImage('data:image/bmp;base64,Qk06AAAAAAAAADYAAAAoAAAAAQAAAAEAAAABABgAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAA////AA==')).toBe(false); // BMP not in whitelist
        expect(isValidImage('data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmogICUg...')).toBe(false);
        expect(isValidImage('data:text/plain;base64,SGVsbG8gV29ybGQ=')).toBe(false);
    });

    test('should return true for relative paths', () => {
        expect(isValidImage('/images/logo.png')).toBe(true);
    });

    test('should return false for invalid inputs', () => {
        expect(isValidImage(null)).toBe(false);
        expect(isValidImage(undefined)).toBe(false);
        expect(isValidImage(123)).toBe(false);
        expect(isValidImage({})).toBe(false);
        expect(isValidImage('just text')).toBe(false);
        expect(isValidImage('ftp://example.com/image.jpg')).toBe(false);
    });
});
