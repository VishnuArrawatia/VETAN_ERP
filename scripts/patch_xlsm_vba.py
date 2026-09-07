import olefile, zipfile, struct, sys, io, os, shutil

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

XLSM = 'Workforce-JULY-2026.xlsm'
OUTPUT = 'Workforce-JULY-2026-fixed.xlsm'

def decompress_chunk(chunk_data):
    output = bytearray()
    pos = 0
    end = len(chunk_data)
    while pos < end:
        flag_byte = chunk_data[pos]
        pos += 1
        for bit in range(8):
            if pos >= end:
                break
            if flag_byte & (1 << bit):
                if pos + 2 > end:
                    break
                byte0 = chunk_data[pos]
                byte1 = chunk_data[pos + 1]
                pos += 2
                length_field = (byte0 >> 4) & 0x0F
                offset_low = byte0 & 0x0F
                if pos < end:
                    byte2 = chunk_data[pos]
                    pos += 1
                    length = length_field | ((byte2 & 0x0F) << 4)
                    length += 3
                    offset = offset_low | ((byte2 >> 4) << 4)
                else:
                    length = length_field + 3
                    offset = offset_low
                copy_start = len(output) - offset - 1
                for i in range(length):
                    idx = copy_start + i
                    if 0 <= idx < len(output):
                        output.append(output[idx])
                    else:
                        output.append(0)
            else:
                output.append(chunk_data[pos])
                pos += 1
    return output

def decompress_vba_stream(data):
    full_output = bytearray()
    chunk_pos = 0
    while chunk_pos < len(data):
        if chunk_pos + 2 > len(data):
            break
        header = struct.unpack_from('<H', data, chunk_pos)[0]
        sig = (header >> 15) & 1
        chunk_size_field = header & 0x7FFF
        chunk_size = chunk_size_field + 3
        if sig != 1:
            break
        chunk_data = data[chunk_pos + 2: chunk_pos + chunk_size]
        decompressed = decompress_chunk(chunk_data)
        full_output.extend(decompressed)
        chunk_pos += chunk_size
    return bytes(full_output)

def compress_vba_stream(data):
    """Compress VBA source using 4096-byte chunks per MS-OVBA spec."""
    result = bytearray()
    pos = 0
    while pos < len(data):
        chunk_data = data[pos:pos + 4096]
        pos += 4096
        compressed = bytearray()
        i = 0
        while i < len(chunk_data):
            best_len = 0
            best_off = 0
            search_start = max(0, i - 4096)
            for j in range(search_start, i):
                match_len = 0
                while i + match_len < len(chunk_data) and match_len < 4095:
                    if chunk_data[j + match_len] == chunk_data[i + match_len]:
                        match_len += 1
                    else:
                        break
                if match_len >= 3 and match_len > best_len:
                    best_len = match_len
                    best_off = i - j
            if best_len >= 3:
                length_field = best_len - 3
                offset_field = best_off - 1
                byte0 = ((length_field & 0x0F) << 4) | (offset_field & 0x0F)
                byte1 = offset_field >> 4
                byte2 = ((length_field >> 4) & 0x0F) | ((0) << 4)
                # Actually the encoding per MS-OVBA:
                # byte0 = (SizeField_lo_nibble << 4) | OffsetField_lo_nibble
                # byte1 = LengthField_lo_nibble | (OffsetField_hi_nibble << 4)
                # Wait, let me re-read the spec properly.
                #
                # Token = 2 bytes:
                #   Byte0 bits 7-4: SizeField[3:0] (low 4 bits of length-3)
                #   Byte0 bits 3-0: OffsetField[3:0] (low 4 bits of offset)
                # Byte1 bits 7-4: OffsetField[7:4] (high bits of offset)
                # Byte1 bits 3-0: LengthField[7:4] (high bits of length-3)
                #
                # So:
                # SizeField = length - 3 (12 bits max, since max copy length = 4098)
                # But SizeField only 8 bits in the encoding...
                # Actually SizeField is 8 bits: low 4 in byte0, high 4 in byte1
                # OffsetField is 8 bits: low 4 in byte0, high 4 in byte1
                
                size_field = best_len - 3  # 8 bits
                offset_field = best_off - 1  # 12 bits max (4096 window)
                
                byte0 = ((size_field & 0x0F) << 4) | (offset_field & 0x0F)
                byte1 = ((offset_field >> 4) & 0xFF)
                # Wait no. Let me read MS-OVBA more carefully:
                # 
                # CompressedToken (2 bytes):
                #   Bits 11-8 of token: SizeField[7:4]
                #   Bits 7-4 of token: SizeField[3:0]  
                #   Bits 3-0 of token: OffsetField[11:8]
                # Then next byte:
                #   Bits 7-0: OffsetField[7:0]
                #
                # Hmm, that doesn't match either. Let me look at the actual encoding:
                #
                # From MS-OVBA 2.4.1:
                # CopyToken:
                #   LengthField (12 bits): length to copy (3..4098)
                #   OffsetField (12 bits): offset into decompressed buffer
                #
                # Encoding (total 3 bytes):
                #   Byte 0: bit 7-4 = SizeField[3:0] (LengthField-3, low 4 bits)
                #           bit 3-0 = OffsetField[3:0] (low 4 bits)
                #   Byte 1: bit 7-4 = OffsetField[7:4] (bits 7-4 of offset)
                #           bit 3-0 = LengthField[7:4] (bits 7-4 of (length-3))
                #
                # Wait that's only 8 bits for offset. But max offset is 4096.
                # Let me re-read...
                #
                # Actually per the spec:
                # CopyToken struct:
                #   SizeField (4 bits): LengthField - 3
                #   OffsetField (12 bits)
                #
                # But 4+12=16 bits = 2 bytes for the CopyToken.
                # Then the next byte provides more bits.
                #
                # OK, I think the encoding is:
                # TokenWord (2 bytes, little-endian):
                #   bits 15-12: SizeField[3:0]
                #   bits 11-0: OffsetField[11:0]
                # 
                # No wait, the spec says:
                # "The CopyToken is encoded as follows:
                #  - SizeField (4 bits): stores LengthField - 3
                #  - OffsetField (12 bits): the distance"
                # Total = 16 bits = one word
                #
                # But then there's also a "CopyTokenLength" byte after...
                # I'm confusing myself. Let me just use a simpler approach:
                # store uncompressed.
                compressed.append(chunk_data[i])
                i += 1
                continue
            compressed.append(chunk_data[i])
            i += 1
        
        chunk_len = len(compressed)
        header = (1 << 15) | (chunk_len + 1)  # sig=1, size = data_len + 1 (header is 2 bytes, size includes header - 3)
        # Actually: CompressedChunkSize = number of bytes in chunk INCLUDING header, minus 3
        # So CompressedChunkSize = (2 + len(compressed)) - 3 = len(compressed) - 1
        # Wait no: header says "CompressedChunkSize - 3" so CompressedChunkSize = header_value + 3
        # And CompressedChunkSize = 2 (header) + len(compressed_data)
        # So header_value = 2 + len(compressed_data) - 3 = len(compressed_data) - 1
        
        # For uncompressed: just store raw
        # Flag byte = 0x00 means all 8 bytes are literal
        raw_data = bytearray()
        raw_data.append(0x00)  # flag byte = all literals
        raw_data.extend(chunk_data)
        raw_len = len(raw_data)
        header = (1 << 15) | (raw_len - 1)
        result.extend(struct.pack('<H', header))
        result.extend(raw_data)
    
    return bytes(result)


# Read original
shutil.copy2(XLSM, OUTPUT)

# Extract VBA project
with zipfile.ZipFile(XLSM, 'r') as zin:
    names = zin.namelist()
    vba_proj_name = None
    for n in names:
        if 'vbaProject.bin' in n:
            vba_proj_name = n
            break

with zipfile.ZipFile(XLSM, 'r') as zin:
    vba_data = zin.read(vba_proj_name)

ole = olefile.OleFileIO(vba_data, write_mode=True)

# Read frmMaster source
raw = ole.openstream('VBA/frmMaster').read()
src = decompress_vba_stream(raw)
src_text = src.decode('utf-8', errors='replace')

print(f'Original frmMaster: {len(src)} chars')

# Apply fixes
import re

# Fix 1: Add SafeFmtDate helper if not present
if 'SafeFmtDate' not in src_text:
    marker = "End Sub\r\n\r\n'--- 1. USERFORM INITIALIZE"
    if marker not in src_text:
        marker = "End Sub\n\n'--- 1. USERFORM INITIALIZE"
    
    safe_func = """'--- Safe Date Format Helper (FIXES DEBUG ERROR) ---
Private Function SafeFmtDate(val As Variant) As String
    On Error Resume Next
    SafeFmtDate = ""
    If Not IsEmpty(val) And Not IsError(val) Then
        If CStr(val) <> "" Then
            If IsDate(val) Then
                SafeFmtDate = Format(CDate(val), "dd-mmm-yy")
            Else
                SafeFmtDate = CStr(val)
            End If
        End If
    End If
    On Error GoTo 0
End Function

"""
    if marker in src_text:
        src_text = src_text.replace(marker, "End Sub\r\n\r\n" + safe_func + "'--- 1. USERFORM INITIALIZE")
        print("Added SafeFmtDate helper function")
    else:
        print("WARNING: Could not find insertion point for SafeFmtDate")

# Fix 2: Replace Format() calls on date cells
count = 0
src_text, n = re.subn(
    r'txtDOL\.Text\s*=\s*Format\(ws\.Cells\(targetRow,\s*39\)\.Value,\s*"dd-mmm-yy"\)(.*)',
    r'txtDOL.Text = SafeFmtDate(ws.Cells(targetRow, 39).Value)  \1',
    src_text
)
count += n
src_text, n = re.subn(
    r'txtDOB\.Text\s*=\s*Format\(ws\.Cells\(targetRow,\s*10\)\.Value,\s*"dd-mmm-yy"\)(.*)',
    r'txtDOB.Text = SafeFmtDate(ws.Cells(targetRow, 10).Value)  \1',
    src_text
)
count += n
src_text, n = re.subn(
    r'TxtDOJ\.Text\s*=\s*Format\(ws\.Cells\(targetRow,\s*11\)\.Value,\s*"dd-mmm-yy"\)(.*)',
    r'TxtDOJ.Text = SafeFmtDate(ws.Cells(targetRow, 11).Value)  \1',
    src_text
)
count += n
print(f"Replaced {count} Format() date calls with SafeFmtDate()")

# Fix 3: Fix empty CalculateTotal
old_calc = re.search(
    r'Sub CalculateTotal\(\)\s*\r?\n\s*On Error Resume Next\r?\n\s*\'[^\r\n]*\r?\n\s*On Error GoTo 0\r?\nEnd Sub',
    src_text
)
if old_calc:
    new_calc = """Sub CalculateTotal()
    On Error Resume Next
    Dim totalWage As Double
    totalWage = Val(txtBasicRate.Text) + Val(txtHRARate.Text) + Val(txtOtherAllow.Text)
    Dim ctrl As MSForms.Control
    For Each ctrl In Me.Controls
        If ctrl.Name = "txtTotal" Or ctrl.Name = "lblTotal" Or ctrl.Name = "txtTotalWage" Then
            ctrl.Caption = Format(totalWage, "0.00")
            ctrl.Text = Format(totalWage, "0.00")
        End If
    Next ctrl
    On Error GoTo 0
End Sub"""
    src_text = src_text[:old_calc.start()] + new_calc + src_text[old_calc.end():]
    print("Fixed empty CalculateTotal() sub")

# Fix 4: Add Call CalculateTotal after search finds worker
if 'Call CalculateTotal' not in src_text:
    src_text = src_text.replace(
        'btnSave.Caption = "UPDATE WORKER"',
        'Call CalculateTotal\r\n\r\n        btnSave.Caption = "UPDATE WORKER"',
        1  # only first occurrence
    )
    print("Added Call CalculateTotal after search")

# Write back compressed
new_src = src_text.encode('utf-8', errors='replace')
compressed = compress_vba_stream(new_src)
ole.write_stream('VBA/frmMaster', compressed)
ole.close()

# Rebuild the zip
with zipfile.ZipFile(XLSM, 'r') as zin:
    with zipfile.ZipFile(OUTPUT, 'w', zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            if item.filename == vba_proj_name:
                # Read the modified OLE data
                with open(OUTPUT + '.ole', 'rb') as f:
                    ole_data = f.read()
                zout.writestr(item, ole_data)
            else:
                zout.writestr(item, zin.read(item.filename))

print(f"\nFixed file saved to: {OUTPUT}")
print("User should rename it to replace the original")

# Also save the fixed frmMaster source for reference
with open('scripts/frmMaster_fixed_source.txt', 'w', encoding='utf-8') as f:
    f.write(src_text)
print("Fixed source saved to: scripts/frmMaster_fixed_source.txt")
