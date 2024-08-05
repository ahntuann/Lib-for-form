function Validator(options) {
    var formElement = document.querySelector(options.form);
    
    // Lưu tất cả các hàm dùng để validate (test) lại dựa trên selector của từng element
    // Xử lý trường hợp có nhiều điều kiện mà nếu chỉ duyệt qua 1 lần thì thằng cuối 
    // cùng nó sẽ ghi đè tất cả các thằng còn lại
    var testSelector = {};

    function getParent(selector, element) {
        while (element.parentElement) {
            if (element.matches(selector))
                return element;
            
            element = element.parentElement;
        }

        return element;
    }

    // Bỏ validate ra riêng
    function validate(rule, inputElement)  {
        var errorMsg;
        var errorElenment = getParent(options.formGroupSelector, inputElement).querySelector(options.errorSelector);
        
        // Duyệt qua tất cả các điều kiện của 1 thằng, điều kiện nào dính thì dừng, in ra 
        tests = testSelector[rule.selector];    
        var n = tests.length;
        for (var i = 0; i < n; i++) {
            var errorMsg;
            switch (inputElement.type) {
                case 'radio':
                case 'checkbox':
                    errorMsg = tests[i](formElement.querySelector(rule.selector + ':checked'));
                    break;

                default: 
                    errorMsg = tests[i](inputElement.value);
            }
             

            if (errorMsg)
                break;
        }

        if (errorMsg) {
            errorElenment.innerText = errorMsg;
            getParent(options.formGroupSelector, inputElement).classList.add('invalid');
        } else {
            errorElenment.innerText = '';
            getParent(options.formGroupSelector, inputElement).classList.remove('invalid');
        }

        return !errorMsg;
    }

    if (formElement) {
        // Xử lý khi submit form
        if (formElement) {
            formElement.onsubmit = (e) => {
                e.preventDefault();

                var isValid = true;

                options.rules.forEach(rule => {
                    if (!validate(rule, formElement.querySelector(rule.selector))) {
                        isValid = false;
                    }
                })

                if (isValid) {
                    // Dùng JS để xử lý submit
                    if (typeof options.onSubmit === 'function') {
                        var enableInputs = formElement.querySelectorAll('[name]:not([disable])');

                        var formValues = Array.from(enableInputs).reduce((value, enableInput) => {
                            switch (enableInput.type) {
                                case 'radio':
                                case 'checkbox':
                                    if (!Array.isArray(value[enableInput.name])) {
                                        value[enableInput.name] = [];
                                    }

                                    if (enableInput.matches(':checked'))
                                        value[enableInput.name].push(enableInput.value);
                                    break;

                                case 'file':
                                    value[enableInput.name] = enableInput.files;
                                    break;

                                default:
                                    value[enableInput.name] = enableInput.value;

                            }
                            return value;
                        }, {})

                        options.onSubmit(formValues);
                    }
                    // Xử lý submit bằng hvi mặc định của HTML 
                    else {
                        formElement.submit();
                    }
                }
            }
        }

        // Duyệt qua tất cả các điều kiện mà mình muốn kiểm tra
        options.rules.forEach(rule => {
            var inputElements = formElement.querySelectorAll(rule.selector);
            
            Array.from(inputElements).forEach((inputElement) => {
                inputElement.addEventListener('blur', () => {
                    validate(rule, inputElement);
                }) 

                inputElement.addEventListener('input', (e) => {
                    var errorElenment = getParent(options.formGroupSelector, inputElement).querySelector(options.errorSelector);
                    errorElenment.innerText = '';
                    getParent(options.formGroupSelector, inputElement).classList.remove('invalid');
                });
            })

            // Lưu lại tất cả các điều kiện như nói bên trên
            if (Array.isArray(testSelector[rule.selector])) {
                testSelector[rule.selector].push(rule.test);
            } else {
                testSelector[rule.selector] = [rule.test]
            }
        });
    }
}

Validator.isRequired = (selector, msg) => {
    return {
        selector: selector,
        test: (value) => {
            return value ? undefined : msg || "Vui lòng nhập trường này";
        }
    }
}

Validator.isEmail = (selector, msg) => {
    return {
        selector: selector,
        test: (value) => {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : msg || 'Bạn phải nhập email';
        }
    }
}

Validator.minLength = (selector, min, msg) => {
    return {
        selector: selector,
        test: (value) => {
            return value.length >= min ? undefined : msg || `Vui lòng nhập ít nhất ${min} ký tự`;
        }
    }
}

Validator.isConfirmed = (selector, confirm, msg) => {
    return {
        selector: selector,
        test: (value) => {
            return confirm() === value ? undefined : (msg || 'Thông tin nhập không chính xác');
        }
    }
}