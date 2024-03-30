const fs = require("fs");

// Add helper functions here
class Helper {

    static capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    static fileExists = async (path) => {
        return !!(await fs.promises.stat(path).catch(e => false));
    }

}


module.exports = Helper;