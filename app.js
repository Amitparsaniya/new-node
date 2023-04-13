var num1Elemetnt = document.getElementById('num1');
var num2Elemetnt = document.getElementById('num2');
var buttonElement = document.querySelector('button');
function add(a, b) {
    return a + b;
}
buttonElement === null || buttonElement === void 0 ? void 0 : buttonElement.addEventListener('click', function () {
    var num1 = num1Elemetnt.value;
    var num2 = num2Elemetnt.value;
    var result = add(+num1, +num2);
    console.log(result);
});
