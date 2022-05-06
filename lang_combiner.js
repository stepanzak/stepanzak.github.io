//function that runs after page is opened
function firstFunction() {

    //set change eventlistener of #langName a #regionName to changeSecondInputLimit() function
    document.querySelectorAll('#langName, #regionName').forEach(item => {
        item.addEventListener('input', event => {
            changeSecondInputLimit(event.target)
        })
    })

    //add event listener to downloadButton that runs generatePackInstaller() function and download output of it
    downloadButton.addEventListener('click', () => {
        console.log('downloadButton clicked');
        downloadFiles()
    })
}

//declare some variables
let langCode
let fileExtension
//get elements by IDs
let getLangsButton = document.getElementById("getLangs")
let selectVersionSelect = document.getElementById("selectVersion")
let selectLang1Select = document.getElementById("selectLang1")
let selectLang2Select = document.getElementById("selectLang2")
let colorOfMainLangSelect = document.getElementById("colorOfMainLang")
let colorOfSecondaryLangSelect = document.getElementById("colorOfSecondaryLang")
let separatorTextInput = document.getElementById("separator")
let colorOfSeparatorSelect = document.getElementById("colorOfSeparator")
//get pack setting elements by ID
let langNameInput = document.getElementById("langName")
let regionNameInput = document.getElementById("regionName")
let packNameInput = document.getElementById("packName")
let packDescriptionInput = document.getElementById("packDescription")
let downloadButton = document.getElementById("downloadButton")

//generate lang file

async function downloadFiles() {
    if (isSettingsValid() === false) return
    let lang1 = selectLang1Select.value
    let lang2 = selectLang2Select.value
    let version = selectVersionSelect.value
    let versionOneNumber = parseInt(version.split(".")[1]) //for 1.18 or 1.18.[any number], it is 18
    console.log(`versionOneNumber: ${versionOneNumber}`)

    //convert lang names (lang1 and lang2) to correct format
    //for example, en_us is:
    //en_US.lang in 1.10 and less
    //en_us.lang in 1.11 and 1.12
    //en_us.json in 1.13 and more
    if (versionOneNumber <= 10) {
        fileExtension = "lang"
        let splLang1 = lang1.split("_") //splitted lang1
        let splLang2 = lang2.split("_") //splitted lang2
        lang1 = `${splLang1[0]}_${splLang1[1].toUpperCase()}`
        lang2 = `${splLang2[0]}_${splLang2[1].toUpperCase()}`
    } else if (versionOneNumber  == 11 || versionOneNumber == 12) {
        fileExtension = "lang"
    } else if (versionOneNumber >= 13) {
        fileExtension = "json"
    }

    //fetch files
    let lang1File = await fetch(`https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/${version}/assets/minecraft/lang/${lang1}.${fileExtension}`)
    let lang2File = await fetch(`https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/${version}/assets/minecraft/lang/${lang2}.${fileExtension}`)

    //check if language is available (response.ok)
    if (!lang1File.ok) {
        alert(`${lang1} is not available in ${version}`)
        return
    }
    if (!lang2File.ok) {
        alert(`${lang2} is not available in ${version}`)
        return
    }

    if (versionOneNumber >= 13) {
        lang1File = await lang1File.json()
        lang2File = await lang2File.json()
    } else {
        lang1File = await lang1File.text()
        lang2File = await lang2File.text()

        //remove empty lines and \n at the end of the file
        lang1File = lang1File.replaceAll(/\n+/g, "\n")
        lang2File = lang2File.replaceAll(/\n+/g, "\n")
        lang1File = lang1File.replaceAll(/\n$/g, "")
        lang2File = lang2File.replaceAll(/\n$/g, "")
        if (lang1File[0] == "\n") lang1File = lang1File.substring(1)
        if (lang2File[0] == "\n") lang2File = lang2File.substring(1)
        //temporary objects
        let lang1Object = {}
        let lang2Object = {}

        //convert .lang files to objects (after creating combined language, it will be converted back into .lang files)
        lang1File.split("\n").forEach((line) => {
            lang1Object[line.split("=")[0]] = line.split("=")[1]
        })

        lang2File.split("\n").forEach((line) => {
            lang2Object[line.split("=")[0]] = line.split("=")[1]
        })
        
        lang1File = lang1Object
        lang2File = lang2Object
    }
    generateLangFile(lang1File, lang2File, lang1, lang2, versionOneNumber)
    download(`install_${packName.value.trim().replaceAll(" ", "_")}_pack.bat`, generatePackInstaller(versionOneNumber))
}

function generateLangFile(lang1File, lang2File, lang1, lang2, versionOneNumber) {
    
    //list of conditions (regex), only if line matches one of them, it will be added to combined language
    let conlist = []
    //list of banned regular expressions (regex), if line matches one of them, it will be ignored,
    //even if it matches one of the conditions in conlist
    let banlist = []
    if (versionOneNumber >= 13) {
        conlist[0] = /item\.minecraft\..*/
        conlist[1] = /block\.minecraft\..*/

        banlist[0] = /item\.minecraft\.debug_stick\..*/
        banlist[1] = /block\.minecraft\.beacon\..*/
    } else {
        conlist[0] = /^item\..*\.name$/
        conlist[1] = /^tile\..*\.name$/

    }
    let result = {}
    let colorOfMainLang = document.getElementById("colorOfMainLang").value
    let colorOfSecondaryLang = document.getElementById("colorOfSecondaryLang").value
    let colorOfSeparator = document.getElementById("colorOfSeparator").value
    let separator = document.getElementById("separator").value

    //this actually create result
    Object.keys(lang1File).forEach((key) => {
        let meetsTheRequirements = false

        conlist.forEach((cond) => {
            if (cond.test(key) == true) {
                meetsTheRequirements = true
            }
        })

        banlist.forEach((ban) => {
            if (ban.test(key) == true) {
                meetsTheRequirements = false
            }
        })

        let value1 = lang1File[key];
        let value2 = lang2File[key];
        if (meetsTheRequirements == true) {
            result[key] = `${colorOfMainLang}${value1}§r${colorOfSeparator}${separator}§r${colorOfSecondaryLang}${value2}§r`;
        }
    });

    //convert result to .lang file if version is 1.12 or less
    if (versionOneNumber <= 12) {
        let dotLangFile = ''
        Object.keys(result).forEach((key) => {
            dotLangFile += `${key}=${result[key]}\n`
        })
        result = dotLangFile
    } else {
        result = JSON.stringify(result)
    }


    

    langCode = `${lang1}-${lang2}`
    download(`${langCode}.${fileExtension}`, result)
}

//function to generate installer (.bat file) for resource pack
function generatePackInstaller(versionOneNumber) {
    let packFormat
    if (versionOneNumber == "18") packFormat = 8
    if (versionOneNumber == "17") packFormat = 7
    if (versionOneNumber == "12") packFormat = 3
    if (versionOneNumber == "8") packFormat = 1
    let batFileString = `@echo off\nif not exist "${langCode}.${fileExtension}" (\necho !\necho !\necho !\necho error, ${langCode}.${fileExtension} is not in the same folder as installer!\necho !\necho !\necho !\ngoto :end\n)\nset "whereistheresult=%cd%"\ncd "%APPDATA%/.minecraft/resourcepacks"\nif exist "${packNameInput.value}" (\necho !\necho !\necho !\necho error, ${packNameInput.value} folder is already here!\necho !\necho !\necho !\ngoto :end\n)\nmkdir "${packNameInput.value}"\ncd "${packNameInput.value}"\necho {"pack":{"pack_format":${packFormat},"description":"${packDescriptionInput.value}"},"language":{"${langCode}":{"name":"${langNameInput.value}","region":"${regionNameInput.value}","bidirectional":false}}}>pack.mcmeta\nmkdir "assets\\minecraft\\lang"\ncd "assets\\minecraft\\lang"\nmove "%whereistheresult%\\${langCode}.${fileExtension}"\ncd %whereistheresult%\ndel install_${packName.value.trim().replaceAll(" ", "_")}_pack.bat\n:end\npause\n:totalEnd\n`
    return batFileString
}

//check if every input in settings is valid
function isSettingsValid() {
    if (selectLang1Select.value === 'nothing') {alert("Please select a language number 1!"); return false}
    if (selectLang2Select.value === 'nothing') {alert("Please select a language number 2!"); return false}
    if (packNameInput.value == false) {alert('Name of the pack is not selected!'); return false}
    if (langNameInput.value == false) {alert('Language of the pack is not selected!'); return false}
    if (separatorTextInput.value == false) {alert('Separator is not selected!'); return false}
    if (regionNameInput.value == false) if (confirm('Name of region is not entered, do you want to continue without it?') === false) return false
    if (packDescriptionInput.value == false) if (confirm('Description of pack is not entered, do you want to continue without it?') === false) return false
    return true
}

/*  language name and region name is showing on the same line in mc settings
langName.lenght + regionName.lenght <= 43 must be true
this function makes that if you change langName or regionName, then limit of the second one will be
will be (42 - changedInput.lenght).
By default, limit of both inputs will be 42 */

function changeSecondInputLimit(first) {
    let second = document.getElementById('regionName')
    if (first.id === 'regionName') second = document.getElementById('langName')
    let langNameSpan = document.getElementById("langNameSpan")
    let regionNameSpan = document.getElementById("regionNameSpan")
    second.maxLength = 42 - first.value.length
    langNameSpan.innerHTML = `${langNameInput.value.length}/${langNameInput.maxLength}`
    regionNameSpan.innerHTML = `${regionNameInput.value.length}/${regionNameInput.maxLength}`
}

firstFunction()