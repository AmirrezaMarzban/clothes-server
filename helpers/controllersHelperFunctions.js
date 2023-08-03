const fs = require("fs");

module.exports.removeWhiteSpaces = str => {
  return str.replace(/ /g, '')
}

module.exports.nameOptimizer = name => {
  function regex(str) {
    return new RegExp(str)
  }

  return name
    .replace(regex('آقای'), '')
    .replace(regex('آقا'), '')
    .replace(regex('جنابه'), '')
    .replace(regex('جناب'), '')
    .replace(regex('سرکار خانوم'), '')
    .replace(regex('سرکار خانم'), '')
    .replace(regex('سرکارخانوم'), '')
    .replace(regex('سرکارخانومه'), '')
    .replace(regex('سرکارخانمه'), '')
    .replace(regex('سرکارخانم'), '')
    .replace(regex('سرکار'), '')
    .replace(regex('خانوم'), '')
    .replace(regex('خانم'), '')
}

module.exports.checkNationalCode = code => {
  var L = code.length

  if (L < 8 || parseInt(code, 10) === 0) return false
  code = ('0000' + code).substr(L + 4 - 10)
  if (parseInt(code.substr(3, 6), 10) === 0) return false
  var c = parseInt(code.substr(9, 1), 10)
  var s = 0
  for (var i = 0; i < 9; i++) {
    s += parseInt(code.substr(i, 1), 10) * (10 - i)
  }
  s = s % 11;
  return (s < 2 && c === s) || (s >= 2 && c === (11 - s))
}

module.exports.isLatinCharactersWithoutSymbol = str => {
  return str.match(/^[A-Za-z]+$/g)
}

module.exports.isLatinCharactersWithSymbol = str => {
  return str.match(/^[a-zA-Z0-9()*_\-!#$%^&*,."\'\][]*$/g)
}

module.exports.hasWhiteSpaces = str => {
  return str.includes(' ')
}

module.exports.isPhoneNumberValid = str => {
  // valid phone: 09184853240
  return str.match(/^(0)9(0[1-5]|[1 3]\d|2[0-2]|9[0-4]|98)\d{7}$/)
}

module.exports.isEmailValid = str => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(str);
}

module.exports.generateSlug = (str) => {
  return str.replaceAll(' ', '-')
}

module.exports.getFileSize = (filePath) => {
  const stats = fs.statSync(filePath)
  const units = ['بایت', 'کیلوبایت', 'مگابایت']
  let fileSizeInBytes = stats.size;
  let i;
  for (i = 0; fileSizeInBytes >= 1024 && i < 4; i++) {
    fileSizeInBytes /= 1024;
  }

  return Math.round(fileSizeInBytes.toFixed(2)) + ' ' + units[i];
}

module.exports.generateRandomDigits = digitsLength => {
  // temp (development tests)
  // return 111111
  var add = 1, max = 12 - add   // 12 is the min safe number Math.random() can generate without it starting to pad the end with zeros.
  if (digitsLength > max) {
    return generateRandomDigits(max) + generateRandomDigits(digitsLength - max)
  }
  max = Math.pow(10, digitsLength + add)
  var min = max / 10 // Math.pow(10, n) basically
  var number = Math.floor(Math.random() * (max - min + 1)) + min

  return ('' + number).substring(add)
}
