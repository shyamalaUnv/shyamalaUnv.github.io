const TextFieldComponent = Formio.Components.components.textfield;
var id = "";
class BarcodeComponent extends TextFieldComponent {

    constructor(component, options, data) {
        super(component, options, data);
    }

    static schema(...extend) {
        return TextFieldComponent.schema({
            type: 'barcode',
            label: 'Barcode',
            input: true,
            key: 'textfield',
            inputType: 'text',
            inputFormat: 'plain',
            barcodeDataField: true

        }, ...extend);
    }

    static get builderInfo() {
        return {
            title: 'Barcode',
            group: 'premium',
            icon: 'barcode',
            weight: 40,
            documentation: 'http://help.form.io/userguide/#textfield',
            schema: BarcodeComponent.schema()
        };
    }

    static addTemplate(name, template) {
        Templates.templates[name] = template;
    }

    get defaultSchema() {
        return BarcodeComponent.schema();
    }

    get inputInfo() {
        const info = super.inputInfo;
        info.type = 'input';
        if (this.component.hasOwnProperty('spellcheck')) {
            info.attr.spellcheck = this.component.spellcheck;
        }

        if (this.component.mask) {
            info.attr.type = 'password';
        } else {
            info.attr.type = (this.component.inputType === 'password') ? 'password' : 'text';
        }
        info.changeEvent = 'input';
        return info;
    }

    get prefix() {
        if (this.component.type && this.component.type === 'barcode') {
            const barcodeIcon = this.renderTemplate('icon', {
                ref: 'icon',
                className: this.iconClass('barcode'),
                styles: '',
                content: ''
            }).trim();
            return barcodeIcon;
        }
    }

    render() {
        return super.render(
            this.renderTemplate('input', {
                prefix: this.prefix,
                input: this.inputInfo,
            })
        );
    }

    attach(element) {
        let attachRef = super.attach(element)
        this.loadRefs(element, {
            prefix: 'icon'
        });
        this.input = this.refs.prefix[0];
        let componentObj = this;
        if (this.input) {
            this.addEventListener(this.input, 'click', (e) => {
                setTimeout(() => {
                    $("#" + componentObj.id + " :input").each(function (e) {
                        id = this.id;
                        window.compId = id;
                        console.log("id =" + id);
                    });
                    let eventCustom = new CustomEvent('openBarcode', {
                        detail: {
                            compObj: componentObj,
                            controlId: id
                        }
                    });
                    document.dispatchEvent(eventCustom);
                }, 200);
            });
        }

        document.addEventListener('barcodeScannedData', (e) => {
            if (e.detail) {
                let idArr = e.detail.componentID.split('-');
                if (formObj.getComponentById(idArr[0]).component.barcodeDataField) {
                    if (formObj.getComponentById(idArr[0]) != null) {
                        formObj.getComponentById(idArr[0]).setValue(e.detail.scannedData);
                    }
                }
                if (formObj.getComponentById(idArr[0]).component.publishEvents) {
                    // publish event 
                    if (formObj.getComponentById(idArr[0]).component.eventName != undefined) {
                        formObj.getComponentById(idArr[0]).events.emit(formObj.getComponentById(idArr[0]).component.eventName, e.detail.scannedData);
                        let eventCustom = new CustomEvent(formObj.getComponentById(idArr[0]).component.eventName, {
                            detail: {
                                scannedData: e.detail.scannedData,

                            }
                        });
                        document.dispatchEvent(eventCustom);

                    }
                }
            }
        }, false);
        this.addShortcut(this.input);
        return attachRef;

    }
}

// Register the component to the Formio.Components registry.
Formio.Components.addComponent("barcode", BarcodeComponent);
