#!/bin/bash

# Script to remove all console.log and debugger statements from entrypoints directory

ENTRYPOINTS_DIR="/Users/liu/Workspace/My/Extensions/HoverInspector-ext/entrypoints"

echo "Starting cleanup of console.log and debugger statements..."

# Find all TypeScript and JavaScript files
find "$ENTRYPOINTS_DIR" -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | while read -r file; do
    echo "Processing: $file"
    
    # Create a temporary file
    temp_file=$(mktemp)
    
    # Remove lines containing console.log (both commented and uncommented)
    # Remove lines containing debugger statements
    # Preserve empty lines that result from removal to maintain line structure
    sed '/console\.log/d; /debugger;*$/d' "$file" > "$temp_file"
    
    # Check if the file was actually modified
    if ! cmp -s "$file" "$temp_file"; then
        # Replace original file with cleaned version
        mv "$temp_file" "$file"
        echo "  - Cleaned: $file"
    else
        # Remove temp file if no changes were made
        rm "$temp_file"
        echo "  - No changes: $file"
    fi
done

echo "Cleanup completed!"

# Verify results
echo "Checking for remaining console.log and debugger statements..."
remaining=$(find "$ENTRYPOINTS_DIR" -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -l "console\.log\|debugger" 2>/dev/null | wc -l)
echo "Files still containing console.log or debugger: $remaining"

if [ "$remaining" -eq 0 ]; then
    echo "✅ All console.log and debugger statements have been successfully removed!"
else
    echo "⚠️  Still found statements in $remaining files. Manual review may be needed."
    find "$ENTRYPOINTS_DIR" -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -l "console\.log\|debugger" 2>/dev/null
fi