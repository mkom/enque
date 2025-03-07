export const rupiahInput = (value) => {
    if (!value) return "";
    return new Intl.NumberFormat("id-ID").format(value).replace(/,/g, "."); 
};
