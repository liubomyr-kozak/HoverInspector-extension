const helpers = new class Helper {
    isFloat(n) {
        return Number(n) === n && n % 1 !== 0;
    };

    ifNumberFloatCut(number) {
        return this.isFloat(number) ? number.toFixed(2) : number;
    };


    preventOnClick(e) {
        debugger
        e.preventDefault();
        e.stopPropagation();
    }
};

export default helpers