//-----------------------------------------------------------------------------
// qrcode-generator (Kazuhiko Arase - BSD License)
// Official pristine client-side QR Code Matrix Generator (Versions 1-40)
//-----------------------------------------------------------------------------
(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.qrcode = factory();
    }
}(this, function() {
    function qrcode(typeNumber, errorCorrectionLevel) {
        var PAD0 = 0xEC;
        var PAD1 = 0x11;

        var _typeNumber = typeNumber;
        var _errorCorrectionLevel = QRErrorCorrectionLevel[errorCorrectionLevel];
        var _modules = null;
        var _moduleCount = 0;
        var _dataCache = null;
        var _dataList = [];

        var _self = {};

        _self.addData = function(data, mode) {
            mode = mode || 'Byte';
            var newData;
            if (mode === 'Byte') {
                newData = new QRByte(data);
            } else {
                throw new Error('Unsupported mode: ' + mode);
            }
            _dataList.push(newData);
            _dataCache = null;
        };

        _self.isDark = function(row, col) {
            if (row < 0 || _moduleCount <= row || col < 0 || _moduleCount <= col) {
                throw new Error(row + "," + col);
            }
            return _modules[row][col];
        };

        _self.getModuleCount = function() {
            return _moduleCount;
        };

        _self.make = function() {
            if (_typeNumber < 1) {
                var typeNumberAuto = 1;
                for (typeNumberAuto = 1; typeNumberAuto < 40; typeNumberAuto++) {
                    var rsBlocks = QRRSBlock.getRSBlocks(typeNumberAuto, _errorCorrectionLevel);
                    var buffer = new QRBitBuffer();
                    for (var i = 0; i < _dataList.length; i++) {
                        var item = _dataList[i];
                        buffer.put(item.getMode(), 4);
                        buffer.put(item.getLength(), QRUtil.getLengthInBits(item.getMode(), typeNumberAuto));
                        item.write(buffer);
                    }
                    var totalDataCount = 0;
                    for (var j = 0; j < rsBlocks.length; j++) {
                        totalDataCount += rsBlocks[j].dataCount;
                    }
                    if (buffer.getLengthInBits() <= totalDataCount * 8) break;
                }
                _typeNumber = typeNumberAuto;
            }
            makeImpl(false, getBestMaskPattern());
        };

        var makeImpl = function(test, maskPattern) {
            _moduleCount = _typeNumber * 4 + 17;
            _modules = new Array(_moduleCount);
            for (var row = 0; row < _moduleCount; row++) {
                _modules[row] = new Array(_moduleCount);
                for (var col = 0; col < _moduleCount; col++) {
                    _modules[row][col] = null;
                }
            }
            setupPositionProbePattern(0, 0);
            setupPositionProbePattern(_moduleCount - 7, 0);
            setupPositionProbePattern(0, _moduleCount - 7);
            setupPositionAdjustPattern();
            setupTimingPattern();
            setupTypeInfo(test, maskPattern);
            if (_typeNumber >= 7) {
                setupTypeNumber(test);
            }
            if (_dataCache == null) {
                _dataCache = createData(_typeNumber, _errorCorrectionLevel, _dataList);
            }
            mapData(_dataCache, maskPattern);
        };

        var setupPositionProbePattern = function(row, col) {
            for (var r = -1; r <= 7; r++) {
                if (row + r <= -1 || _moduleCount <= row + r) continue;
                for (var c = -1; c <= 7; c++) {
                    if (col + c <= -1 || _moduleCount <= col + c) continue;
                    if ((0 <= r && r <= 6 && (c == 0 || c == 6)) ||
                        (0 <= c && c <= 6 && (r == 0 || r == 6)) ||
                        (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
                        _modules[row + r][col + c] = true;
                    } else {
                        _modules[row + r][col + c] = false;
                    }
                }
            }
        };

        var getBestMaskPattern = function() {
            var minLostPoint = 0;
            var bestMaskPattern = 0;
            for (var i = 0; i < 8; i++) {
                makeImpl(true, i);
                var lostPoint = QRUtil.getLostPoint(_self);
                if (i == 0 || minLostPoint > lostPoint) {
                    minLostPoint = lostPoint;
                    bestMaskPattern = i;
                }
            }
            return bestMaskPattern;
        };

        var setupTimingPattern = function() {
            for (var r = 8; r < _moduleCount - 8; r++) {
                if (_modules[r][6] != null) continue;
                _modules[r][6] = (r % 2 == 0);
            }
            for (var c = 8; c < _moduleCount - 8; c++) {
                if (_modules[6][c] != null) continue;
                _modules[6][c] = (c % 2 == 0);
            }
        };

        var setupPositionAdjustPattern = function() {
            var pos = QRUtil.getPatternPosition(_typeNumber);
            for (var i = 0; i < pos.length; i++) {
                for (var j = 0; j < pos.length; j++) {
                    var row = pos[i];
                    var col = pos[j];
                    if (_modules[row][col] != null) continue;
                    for (var r = -2; r <= 2; r++) {
                        for (var c = -2; c <= 2; c++) {
                            if (r == -2 || r == 2 || c == -2 || c == 2 || (r == 0 && c == 0)) {
                                _modules[row + r][col + c] = true;
                            } else {
                                _modules[row + r][col + c] = false;
                            }
                        }
                    }
                }
            }
        };

        var setupTypeNumber = function(test) {
            var bits = QRUtil.getBCHTypeNumber(_typeNumber);
            for (var i = 0; i < 18; i++) {
                var mod = (!test && ((bits >> i) & 1) == 1);
                _modules[Math.floor(i / 3)][i % 3 + _moduleCount - 8 - 3] = mod;
            }
            for (var i = 0; i < 18; i++) {
                var mod = (!test && ((bits >> i) & 1) == 1);
                _modules[i % 3 + _moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
            }
        };

        var setupTypeInfo = function(test, maskPattern) {
            var data = (_errorCorrectionLevel << 3) | maskPattern;
            var bits = QRUtil.getBCHTypeInfo(data);
            for (var i = 0; i < 15; i++) {
                var mod = (!test && ((bits >> i) & 1) == 1);
                if (i < 6) {
                    _modules[i][8] = mod;
                } else if (i < 8) {
                    _modules[i + 1][8] = mod;
                } else {
                    _modules[_moduleCount - 15 + i][8] = mod;
                }
            }
            for (var i = 0; i < 15; i++) {
                var mod = (!test && ((bits >> i) & 1) == 1);
                if (i < 8) {
                    _modules[8][_moduleCount - i - 1] = mod;
                } else if (i < 9) {
                    _modules[8][15 - i - 1 + 1] = mod;
                } else {
                    _modules[8][15 - i - 1] = mod;
                }
            }
            _modules[_moduleCount - 8][8] = (!test);
        };

        var mapData = function(data, maskPattern) {
            var inc = -1;
            var row = _moduleCount - 1;
            var bitIndex = 7;
            var byteIndex = 0;
            var maskFunc = QRUtil.getMaskFunction(maskPattern);

            for (var col = _moduleCount - 1; col > 0; col -= 2) {
                if (col == 6) col -= 1;
                while (true) {
                    for (var c = 0; c < 2; c++) {
                        if (_modules[row][col - c] == null) {
                            var dark = false;
                            if (byteIndex < data.length) {
                                dark = (((data[byteIndex] >>> bitIndex) & 1) == 1);
                            }
                            var mask = maskFunc(row, col - c);
                            if (mask) dark = !dark;
                            _modules[row][col - c] = dark;
                            bitIndex--;
                            if (bitIndex == -1) {
                                byteIndex++;
                                bitIndex = 7;
                            }
                        }
                    }
                    row += inc;
                    if (row < 0 || _moduleCount <= row) {
                        row -= inc;
                        inc = -inc;
                        break;
                    }
                }
            }
        };

        var createData = function(typeNumber, errorCorrectionLevel, dataList) {
            var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectionLevel);
            var buffer = new QRBitBuffer();
            for (var i = 0; i < dataList.length; i++) {
                var item = dataList[i];
                buffer.put(item.getMode(), 4);
                buffer.put(item.getLength(), QRUtil.getLengthInBits(item.getMode(), typeNumber));
                item.write(buffer);
            }
            var totalDataCount = 0;
            for (var j = 0; j < rsBlocks.length; j++) {
                totalDataCount += rsBlocks[j].dataCount;
            }
            if (buffer.getLengthInBits() > totalDataCount * 8) {
                throw new Error("code length overflow. (" + buffer.getLengthInBits() + ">" + (totalDataCount * 8) + ")");
            }
            if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
                buffer.put(0, 4);
            }
            while (buffer.getLengthInBits() % 8 != 0) {
                buffer.putBit(false);
            }
            while (true) {
                if (buffer.getLengthInBits() >= totalDataCount * 8) break;
                buffer.put(PAD0, 8);
                if (buffer.getLengthInBits() >= totalDataCount * 8) break;
                buffer.put(PAD1, 8);
            }
            return createBytes(buffer, rsBlocks);
        };

        var createBytes = function(buffer, rsBlocks) {
            var offset = 0;
            var maxDcCount = 0;
            var maxEcCount = 0;
            var dcdata = new Array(rsBlocks.length);
            var ecdata = new Array(rsBlocks.length);

            for (var r = 0; r < rsBlocks.length; r++) {
                var dcCount = rsBlocks[r].dataCount;
                var ecCount = rsBlocks[r].totalCount - dcCount;
                maxDcCount = Math.max(maxDcCount, dcCount);
                maxEcCount = Math.max(maxEcCount, ecCount);

                dcdata[r] = new Array(dcCount);
                for (var i = 0; i < dcdata[r].length; i++) {
                    dcdata[r][i] = 0xff & buffer.getBuffer()[i + offset];
                }
                offset += dcCount;

                var rsPoly = QRUtil.getErrorCorrectionPolynomial(ecCount);
                var rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
                var modPoly = rawPoly.mod(rsPoly);
                ecdata[r] = new Array(rsPoly.getLength() - 1);
                for (var j = 0; j < ecdata[r].length; j++) {
                    var modIndex = j + modPoly.getLength() - ecdata[r].length;
                    ecdata[r][j] = (modIndex >= 0) ? modPoly.getAt(modIndex) : 0;
                }
            }

            var totalCodeCount = 0;
            for (var k = 0; k < rsBlocks.length; k++) {
                totalCodeCount += rsBlocks[k].totalCount;
            }

            var data = new Array(totalCodeCount);
            var index = 0;

            for (var x = 0; x < maxDcCount; x++) {
                for (var s = 0; s < rsBlocks.length; s++) {
                    if (x < dcdata[s].length) {
                        data[index++] = dcdata[s][x];
                    }
                }
            }

            for (var y = 0; y < maxEcCount; y++) {
                for (var t = 0; t < rsBlocks.length; t++) {
                    if (y < ecdata[t].length) {
                        data[index++] = ecdata[t][y];
                    }
                }
            }

            return data;
        };

        _self.createSvgTag = function(cellSize, margin, fgColor, bgColor) {
            cellSize = cellSize || 4;
            margin = (typeof margin === 'undefined') ? 4 : margin;
            fgColor = fgColor || '#000000';
            bgColor = bgColor || '#ffffff';

            var size = _moduleCount * cellSize + margin * 2;
            var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '">';
            svg += '<rect width="100%" height="100%" fill="' + bgColor + '"/>';
            svg += '<path d="';

            for (var r = 0; r < _moduleCount; r++) {
                for (var c = 0; c < _moduleCount; c++) {
                    if (_self.isDark(r, c)) {
                        var x = c * cellSize + margin;
                        var y = r * cellSize + margin;
                        svg += 'M' + x + ',' + y + 'h' + cellSize + 'v' + cellSize + 'h-' + cellSize + 'z ';
                    }
                }
            }
            svg += '" fill="' + fgColor + '"/>';
            svg += '</svg>';
            return svg;
        };

        return _self;
    }

    // QR Mode Enum
    var QRMode = { MODE_NUMBER: 1 << 0, MODE_ALPHA_NUM: 1 << 1, MODE_8BIT_BYTE: 1 << 2, MODE_KANJI: 1 << 3 };

    // Error Correction Levels
    var QRErrorCorrectionLevel = { L: 1, M: 0, Q: 3, H: 2 };

    // UTF-8 Byte Encoder
    function QRByte(data) {
        this.mode = QRMode.MODE_8BIT_BYTE;
        this.data = data;

        var bytes = [];
        for (var i = 0; i < data.length; i++) {
            var code = data.charCodeAt(i);
            if (code < 0x80) {
                bytes.push(code);
            } else if (code < 0x800) {
                bytes.push(0xc0 | (code >> 6));
                bytes.push(0x80 | (code & 0x3f));
            } else if (code < 0xd800 || code >= 0xe000) {
                bytes.push(0xe0 | (code >> 12));
                bytes.push(0x80 | ((code >> 6) & 0x3f));
                bytes.push(0x80 | (code & 0x3f));
            } else {
                i++;
                code = 0x10000 + (((code & 0x3ff) << 10) | (data.charCodeAt(i) & 0x3ff));
                bytes.push(0xf0 | (code >> 18));
                bytes.push(0x80 | ((code >> 12) & 0x3f));
                bytes.push(0x80 | ((code >> 6) & 0x3f));
                bytes.push(0x80 | (code & 0x3f));
            }
        }
        this.bytes = bytes;
    }

    QRByte.prototype = {
        getMode: function() { return this.mode; },
        getLength: function() { return this.bytes.length; },
        write: function(buffer) {
            for (var i = 0; i < this.bytes.length; i++) {
                buffer.put(this.bytes[i], 8);
            }
        }
    };

    // Math & Polynomial Helpers
    var QRMath = {
        glog: function(n) {
            if (n < 1) throw new Error("glog(" + n + ")");
            return QRMath.LOG_TABLE[n];
        },
        gexp: function(n) {
            while (n < 0) n += 255;
            while (n >= 256) n -= 255;
            return QRMath.EXP_TABLE[n];
        },
        EXP_TABLE: new Array(256),
        LOG_TABLE: new Array(256)
    };

    for (var i = 0; i < 8; i++) QRMath.EXP_TABLE[i] = 1 << i;
    for (var i = 8; i < 256; i++) QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4] ^ QRMath.EXP_TABLE[i - 5] ^ QRMath.EXP_TABLE[i - 6] ^ QRMath.EXP_TABLE[i - 8];
    for (var i = 0; i < 255; i++) QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;

    function QRPolynomial(num, shift) {
        if (typeof num.length == 'undefined') {
            throw new Error(num.length + "/" + shift);
        }
        var offset = 0;
        while (offset < num.length && num[offset] == 0) {
            offset++;
        }
        this.num = new Array(num.length - offset + shift);
        for (var i = 0; i < num.length - offset; i++) {
            this.num[i] = num[i + offset];
        }
    }

    QRPolynomial.prototype = {
        getAt: function(index) {
            return this.num[index];
        },
        getLength: function() {
            return this.num.length;
        },
        multiply: function(e) {
            var num = new Array(this.getLength() + e.getLength() - 1);
            for (var i = 0; i < num.length; i++) num[i] = 0;
            for (var i = 0; i < this.getLength(); i++) {
                for (var j = 0; j < e.getLength(); j++) {
                    if (this.getAt(i) != 0 && e.getAt(j) != 0) { num[i + j] ^= QRMath.gexp(QRMath.glog(this.getAt(i)) + QRMath.glog(e.getAt(j))); }
                }
            }
            return new QRPolynomial(num, 0);
        },
        mod: function(e) {
            if (this.getLength() - e.getLength() < 0) {
                return this;
            }
            var ratio = QRMath.glog(this.getAt(0)) - QRMath.glog(e.getAt(0));
            var num = new Array(this.getLength());
            for (var i = 0; i < this.getLength(); i++) {
                num[i] = this.getAt(i);
            }
            for (var i = 0; i < e.getLength(); i++) {
                if (e.getAt(i) != 0) { num[i] ^= QRMath.gexp(QRMath.glog(e.getAt(i)) + ratio); }
            }
            return new QRPolynomial(num, 0).mod(e);
        }
    };

    // Reed-Solomon Blocks (Full Versions 1 to 40)
    function QRRSBlock(totalCount, dataCount) {
        this.totalCount = totalCount;
        this.dataCount = dataCount;
    }

    QRRSBlock.RS_BLOCK_TABLE = [
        // 1
        [1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9],
        // 2
        [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16],
        // 3
        [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13],
        // 4
        [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9],
        // 5
        [1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12],
        // 6
        [2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15],
        // 7
        [2, 98, 78], [4, 49, 31], [2, 32, 14, 4, 33, 15], [4, 39, 13, 1, 40, 14],
        // 8
        [2, 121, 97], [2, 60, 38, 2, 61, 39], [4, 40, 18, 2, 41, 19], [4, 40, 14, 2, 41, 15],
        // 9
        [2, 146, 116], [3, 58, 36, 2, 59, 37], [4, 36, 16, 4, 37, 17], [4, 36, 12, 4, 37, 13],
        // 10
        [2, 86, 68, 2, 87, 69], [4, 69, 43, 1, 70, 44], [6, 43, 19, 2, 44, 20], [6, 43, 15, 2, 44, 16],
        // 11
        [4, 101, 81], [1, 80, 50, 4, 81, 51], [4, 50, 22, 4, 51, 23], [3, 36, 12, 8, 37, 13],
        // 12
        [2, 116, 92, 2, 117, 93], [6, 58, 36, 2, 59, 37], [4, 46, 20, 6, 47, 21], [7, 42, 14, 4, 43, 15],
        // 13
        [4, 133, 107], [8, 59, 37, 1, 60, 38], [8, 44, 20, 4, 45, 21], [12, 33, 11, 4, 34, 12],
        // 14
        [3, 145, 115, 1, 146, 116], [4, 64, 40, 5, 65, 41], [11, 36, 16, 5, 37, 17], [11, 36, 12, 5, 37, 13],
        // 15
        [5, 109, 87, 1, 110, 88], [5, 65, 41, 5, 66, 42], [5, 54, 24, 7, 55, 25], [11, 36, 12, 7, 37, 13],
        // 16
        [5, 122, 98, 1, 123, 99], [7, 73, 45, 3, 74, 46], [15, 43, 19, 2, 44, 20], [3, 45, 15, 13, 46, 16],
        // 17
        [1, 135, 107, 5, 136, 108], [10, 74, 46, 1, 75, 47], [1, 50, 22, 15, 51, 23], [2, 42, 14, 17, 43, 15],
        // 18
        [5, 150, 120, 1, 151, 121], [9, 69, 43, 4, 70, 44], [17, 50, 22, 1, 51, 23], [2, 42, 14, 19, 43, 15],
        // 19
        [3, 141, 113, 4, 142, 114], [3, 70, 44, 11, 71, 45], [17, 47, 21, 4, 48, 22], [9, 39, 13, 16, 40, 14],
        // 20
        [3, 135, 107, 5, 136, 108], [3, 67, 41, 13, 68, 42], [15, 54, 24, 5, 55, 25], [15, 43, 15, 10, 44, 16],
        // 21
        [4, 144, 116, 4, 145, 117], [17, 68, 42], [17, 50, 22, 6, 51, 23], [19, 46, 16, 6, 47, 17],
        // 22
        [2, 139, 111, 7, 140, 112], [17, 74, 46], [7, 54, 24, 16, 55, 25], [34, 37, 13],
        // 23
        [4, 151, 121, 5, 152, 122], [4, 75, 47, 14, 76, 48], [11, 54, 24, 14, 55, 25], [16, 45, 15, 14, 46, 16],
        // 24
        [6, 147, 117, 4, 148, 118], [6, 73, 45, 14, 74, 46], [11, 54, 24, 16, 55, 25], [30, 46, 16, 2, 47, 17],
        // 25
        [8, 132, 106, 4, 133, 107], [8, 75, 47, 13, 76, 48], [7, 54, 24, 22, 55, 25], [22, 45, 15, 13, 46, 16],
        // 26
        [10, 142, 114, 2, 143, 115], [19, 74, 46, 4, 75, 47], [28, 50, 22, 6, 51, 23], [33, 46, 16, 4, 47, 17],
        // 27
        [8, 152, 122, 4, 153, 123], [22, 73, 45, 3, 74, 46], [8, 53, 23, 26, 54, 24], [12, 45, 15, 28, 46, 16],
        // 28
        [3, 147, 117, 10, 148, 118], [3, 73, 45, 23, 74, 46], [4, 54, 24, 31, 55, 25], [11, 45, 15, 31, 46, 16],
        // 29
        [7, 146, 116, 7, 147, 117], [21, 73, 45, 7, 74, 46], [1, 53, 23, 37, 54, 24], [19, 45, 15, 26, 46, 16],
        // 30
        [5, 145, 115, 10, 146, 116], [19, 75, 47, 10, 76, 48], [15, 54, 24, 25, 55, 25], [23, 45, 15, 25, 46, 16],
        // 31
        [13, 145, 115, 3, 146, 116], [2, 74, 46, 29, 75, 47], [42, 54, 24, 1, 55, 25], [23, 45, 15, 28, 46, 16],
        // 32
        [17, 145, 115], [10, 74, 46, 23, 75, 47], [10, 54, 24, 35, 55, 25], [19, 45, 15, 35, 46, 16],
        // 33
        [17, 145, 115, 1, 146, 116], [14, 74, 46, 21, 75, 47], [29, 54, 24, 19, 55, 25], [11, 45, 15, 46, 46, 16],
        // 34
        [13, 145, 115, 6, 146, 116], [14, 74, 46, 23, 75, 47], [44, 54, 24, 7, 55, 25], [59, 46, 16, 1, 47, 17],
        // 35
        [12, 151, 121, 7, 152, 122], [12, 75, 47, 26, 76, 48], [39, 54, 24, 14, 55, 25], [22, 45, 15, 41, 46, 16],
        // 36
        [6, 151, 121, 14, 152, 122], [6, 75, 47, 34, 76, 48], [46, 54, 24, 10, 55, 25], [2, 45, 15, 64, 46, 16],
        // 37
        [17, 152, 122, 4, 153, 123], [29, 74, 46, 14, 75, 47], [49, 54, 24, 10, 55, 25], [24, 45, 15, 46, 46, 16],
        // 38
        [4, 152, 122, 18, 153, 123], [13, 74, 46, 32, 75, 47], [48, 54, 24, 14, 55, 25], [42, 45, 15, 32, 46, 16],
        // 39
        [20, 147, 117, 4, 148, 118], [40, 75, 47, 7, 76, 48], [43, 54, 24, 22, 55, 25], [10, 45, 15, 67, 46, 16],
        // 40
        [19, 148, 118, 6, 149, 119], [18, 75, 47, 31, 76, 48], [34, 54, 24, 34, 55, 25], [20, 45, 15, 61, 46, 16]
    ];

    QRRSBlock.getRSBlocks = function(typeNumber, errorCorrectionLevel) {
        var rsBlock = QRRSBlock.getRsBlockTable(typeNumber, errorCorrectionLevel);
        if (typeof rsBlock === 'undefined') throw new Error("bad rs block @ typeNumber:" + typeNumber + "/errorCorrectionLevel:" + errorCorrectionLevel);
        var length = rsBlock.length / 3;
        var list = [];
        for (var i = 0; i < length; i++) {
            var count = rsBlock[i * 3 + 0];
            var totalCount = rsBlock[i * 3 + 1];
            var dataCount = rsBlock[i * 3 + 2];
            for (var j = 0; j < count; j++) {
                list.push(new QRRSBlock(totalCount, dataCount));
            }
        }
        return list;
    };

    QRRSBlock.getRsBlockTable = function(typeNumber, errorCorrectionLevel) {
        switch (errorCorrectionLevel) {
            case QRErrorCorrectionLevel.L: return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
            case QRErrorCorrectionLevel.M: return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
            case QRErrorCorrectionLevel.Q: return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
            case QRErrorCorrectionLevel.H: return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
            default: return undefined;
        }
    };

    function QRBitBuffer() {
        this.buffer = [];
        this.length = 0;
    }

    QRBitBuffer.prototype = {
        getBuffer: function() { return this.buffer; },
        getLengthInBits: function() { return this.length; },
        put: function(num, length) {
            for (var i = 0; i < length; i++) {
                this.putBit(((num >>> (length - i - 1)) & 1) == 1);
            }
        },
        putBit: function(bit) {
            var bufIndex = Math.floor(this.length / 8);
            if (this.buffer.length <= bufIndex) this.buffer.push(0);
            if (bit) this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
            this.length++;
        }
    };

    var QRUtil = {
        PATTERN_POSITION_TABLE: [
            [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
            [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54],
            [6, 32, 58], [6, 34, 62], [6, 26, 46, 66], [6, 26, 48, 70],
            [6, 26, 50, 74], [6, 30, 54, 78], [6, 30, 56, 82], [6, 30, 58, 86],
            [6, 34, 62, 90], [6, 28, 50, 72, 94], [6, 26, 50, 74, 98],
            [6, 30, 54, 78, 102], [6, 28, 54, 80, 106], [6, 32, 58, 84, 110],
            [6, 30, 58, 86, 114], [6, 34, 62, 90, 118], [6, 26, 50, 74, 98, 122],
            [6, 30, 54, 78, 102, 126], [6, 26, 52, 78, 104, 130],
            [6, 30, 56, 82, 108, 134], [6, 34, 60, 86, 112, 138],
            [6, 30, 58, 86, 114, 142], [6, 34, 62, 90, 118, 146],
            [6, 30, 54, 78, 102, 126, 150], [6, 24, 50, 76, 102, 128, 154],
            [6, 28, 54, 80, 106, 132, 158], [6, 32, 58, 84, 110, 136, 162],
            [6, 26, 54, 82, 110, 138, 166], [6, 30, 58, 86, 114, 142, 170]
        ],
        G15: (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0),
        G18: (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0),
        G15_MASK: (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1),

        getBCHTypeInfo: function(data) {
            var d = data << 10;
            while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
                d ^= (QRUtil.G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15)));
            }
            return ((data << 10) | d) ^ QRUtil.G15_MASK;
        },
        getBCHTypeNumber: function(data) {
            var d = data << 12;
            while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) >= 0) {
                d ^= (QRUtil.G18 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18)));
            }
            return (data << 12) | d;
        },
        getBCHDigit: function(data) {
            var digit = 0;
            while (data != 0) { digit++; data >>>= 1; }
            return digit;
        },
        getPatternPosition: function(typeNumber) {
            return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1] || [];
        },
        getMaskFunction: function(maskPattern) {
            switch (maskPattern) {
                case 0: return function(i, j) { return (i + j) % 2 == 0; };
                case 1: return function(i, j) { return i % 2 == 0; };
                case 2: return function(i, j) { return j % 3 == 0; };
                case 3: return function(i, j) { return (i + j) % 3 == 0; };
                case 4: return function(i, j) { return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 == 0; };
                case 5: return function(i, j) { return (i * j) % 2 + (i * j) % 3 == 0; };
                case 6: return function(i, j) { return ((i * j) % 2 + (i * j) % 3) % 2 == 0; };
                case 7: return function(i, j) { return ((i * j) % 3 + (i + j) % 2) % 2 == 0; };
                default: throw new Error("bad maskPattern:" + maskPattern);
            }
        },
        getErrorCorrectionPolynomial: function(errorCorrectionLength) {
            var a = new QRPolynomial([1], 0);
            for (var i = 0; i < errorCorrectionLength; i++) {
                a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
            }
            return a;
        },
        getLengthInBits: function(mode, type) {
            if (1 <= type && type < 10) return 8;
            if (type < 27) return 16;
            return 16;
        },
        getLostPoint: function(qrCode) {
            var moduleCount = qrCode.getModuleCount();
            var lostPoint = 0;
            for (var row = 0; row < moduleCount; row++) {
                for (var col = 0; col < moduleCount; col++) {
                    var sameCount = 0;
                    var dark = qrCode.isDark(row, col);
                    for (var r = -1; r <= 1; r++) {
                        if (row + r < 0 || moduleCount <= row + r) continue;
                        for (var c = -1; c <= 1; c++) {
                            if (col + c < 0 || moduleCount <= col + c) continue;
                            if (r == 0 && c == 0) continue;
                            if (dark == qrCode.isDark(row + r, col + c)) sameCount++;
                        }
                    }
                    if (sameCount > 5) lostPoint += (3 + sameCount - 5);
                }
            }
            return lostPoint;
        }
    };

    return qrcode;
}));
