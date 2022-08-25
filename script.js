const MDAT = 'mdat';
const MOOF = 'moof';
const TRAF = 'traf';

const getReport = (type, size) => {
    const now = getFormattedDate();
    console.log(`${now} Found box of type ${type} and size ${size}`);
};

const responseStatusChecker = (response) => {
    if (!response.ok) {
        throw new Error(`Response Status Code: ${response.status}`);
    }
    return response;
};

const getNextIndex = (index, size, type) => {
    switch (type) {
        case MOOF:
        case TRAF:
            return index + 8;
        default:
            return index + size;
    }
};

const getImageElement = (xmlTag) => {
    const tagAttributes = xmlTag.attributes;
    const encoding = tagAttributes.getNamedItem('encoding').nodeValue;
    const imageType = tagAttributes.getNamedItem('imagetype').nodeValue;
    const imgElement = document.createElement('img');
    imgElement.src = `data:image/${imageType};${encoding},${xmlTag.textContent}`;
    return imgElement;
};

const getBoxSize = (buffer, index) => {
    const sizeBytes = buffer.slice(index, index + 4);
    const sizeView = new DataView(sizeBytes);
    return sizeView.getUint32();
};

const getBoxType = (buffer, index) => {
    const typeBytes = buffer.slice(index + 4, index + 8);
    const typeByteArr = new Uint8Array(typeBytes);
    return String.fromCharCode(...typeByteArr);
};

const getFormattedDate = () =>
    new Date().toISOString().replace('Z', '').replace('T', ' ');

const handleMDATBox = (buffer, index, size) => {
    const now = getFormattedDate();
    const xmlBytes = buffer.slice(index + 8, index + size);
    const xmlByteArr = new Uint8Array(xmlBytes);
    const xmlString = String.fromCharCode(...xmlByteArr);
    console.log(`${now} Content of mdat box is: ${xmlString}`);

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    const imageTags = xmlDoc.getElementsByTagName('smpte:image');

    const imageContainer = document.getElementById('image-container');
    for (const imageTag of imageTags) {
        const imgElement = getImageElement(imageTag);
        imageContainer.appendChild(imgElement);
    }
};

const handleFile = (mp4Buffer) => {
    let index = 0;
    while (index < mp4Buffer.byteLength) {
        const boxSize = getBoxSize(mp4Buffer, index);
        const boxType = getBoxType(mp4Buffer, index);
        const isMDATBox = boxType === MDAT;
        getReport(boxType, boxSize);
        isMDATBox && handleMDATBox(mp4Buffer, index, boxSize);
        index = getNextIndex(index, boxSize, boxType);
    }
};


const fetchDataFromUrl = async (url) => {
    const response = await fetch(url);
    return responseStatusChecker(response);
}

const onClickHandler = async () => {
    const { value: url } = document.getElementById('URLInput');
    if (!url) return;

    try {
        const responsePayload = await fetchDataFromUrl(url);
        responseBuffer = await responsePayload.arrayBuffer();
        handleFile(responseBuffer);
    } catch(error) {
        console.log('Error:', error)
    };
};