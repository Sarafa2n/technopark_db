export const validateColumn = (column: string) => {
    return {
        name: column,
        skip: function() { return !this[column]}
    };
};

export const isId = (value: string) => {
    if ( /^\d+$/.test(value)){
        return true
    }
    return false
};

export const convertToSlug = (str: string): string => {
    return str
        .toLowerCase()
        .replace(/[^\w ]+/g,'')
        .replace(/ +/g,'-');
};
