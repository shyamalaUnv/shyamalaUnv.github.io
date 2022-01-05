const InputComponentForSignature = Formio.Components.components.input;
const signatureTemplate = Formio.Templates;
class SignatureComponent extends InputComponentForSignature {

  static schema(...extend) {
    return InputComponentForSignature.schema({
      type: 'signature',
      label: 'Signature',
      key: 'signature',
      footer: 'Sign above',
      width: '100%',
      height: '150px',
      penColor: 'black',
      backgroundColor: 'rgb(245,245,235)',
      minWidth: '0.5',
      maxWidth: '2.5',
      textString: "Your Text HERE",
    }, ...extend);
  }

  static get builderInfo() {
    return {
      title: 'Signature',
      group: 'advanced',
      icon: 'pencil',
      weight: 120,
      documentation: '/userguide/#signature',
      schema: SignatureComponent.schema()
    };
  }

  init() {
    signatureTemplate.templates.bootstrap.customSignatureTemp = {
      form: `
      {{ctx.element}}
     <button class="btn btn-sm btn-primary" ref="clicktoSign">{{ctx.t('Click to Sign')}}</button>
    <div
    class="signature-pad-body"
    style="width: {{ctx.component.width}};height: {{ctx.component.height}};padding:0;margin:0;"
    tabindex="{{ctx.component.tabindex || 0}}"
    ref="padBody"
    >
    
    <a class="btn btn-sm btn-light signature-pad-refresh" ref="refresh">
    <i class="{{ctx.iconClass('refresh')}}"></i>
    </a>
    <canvas class="signature-pad-canvas" height="{{ctx.component.height}}" ref="canvas"></canvas>
    {% if (ctx.required) { %}
    <span class="form-control-feedback field-required-inline text-danger">
    <i class="{{ctx.iconClass('asterisk')}}"></i>
    </span>
    {% } %}
    <img style="width: 100%;display: none;" ref="signatureImage">
    </div>
    {% if (ctx.component.footer) { %}
    <div class="signature-pad-footer">
    {{ctx.t(ctx.component.footer, { _userInput: true })}}
    </div>
    {% } %}`
    };
    super.init();
    this.currentWidth = 0;
    this.scale = 1;

    if (!this.component.width) {
      this.component.width = '100%';
    }
    if (!this.component.height) {
      this.component.height = '200px';
    }
  }

  get emptyValue() {
    return '';
  }

  get defaultSchema() {
    return SignatureComponent.schema();
  }

  get inputInfo() {
    const info = super.inputInfo;
    info.type = 'input';
    info.attr.type = 'hidden';
    return info;
  }

  get className() {
    return `${super.className} signature-pad`;
  }

  labelIsHidden() {
    return this.component.hideLabel;
  }

  setValue(value, flags = {}) {
    const changed = super.setValue(value, flags);
    if(localStorage.getItem('flatten') === 'true' || localStorage.getItem('renderMode') === 'html'){
      if(this.refs.value){
        this.refs.value.style.display = 'none';
      }
      if(this.refs.clicktoSign){
        this.refs.clicktoSign.style.display = 'none';
      }
  }
    if (value && this.refs.signatureImage && (this.options.readOnly || this.disabled)) {
      this.refs.signatureImage.setAttribute('src', value);
      this.showCanvas(false);
    }
    if (this.signaturePad) {
      if (!value) {
        this.signaturePad.clear();
      } else if (changed) {
        this.triggerChange();
      }
    }

    if (this.signaturePad && this.dataValue && this.signaturePad.isEmpty()) {
      this.setDataToSigaturePad();
    }

    return changed;
  }

  showCanvas(show) {
    if (show) {
      if (this.refs.canvas) {
        this.refs.canvas.style.display = 'inherit';
      }
      if (this.refs.signatureImage) {
        this.refs.signatureImage.style.display = 'none';
      }
    } else {
      if (this.refs.canvas) {
        this.refs.canvas.style.display = 'none';
      }
      if (this.refs.signatureImage) {
        this.refs.signatureImage.style.display = 'inherit';
      }
    }
  }

  onDisabled() {
    this.showCanvas(!super.disabled);
    if (this.signaturePad) {
      if (super.disabled) {
        this.signaturePad.off();
        if (this.refs.refresh) {
          this.refs.refresh.classList.add('disabled');
        }
        if (this.refs.clicktoSign) {
          this.refs.clicktoSign.disabled = true;
        }
        if (this.refs.signatureImage && this.dataValue) {
          this.refs.signatureImage.setAttribute('src', this.dataValue);
        }
      } else {
        this.signaturePad.on();
        if (this.refs.refresh) {
          this.refs.refresh.classList.remove('disabled');
        }
        if (this.refs.clicktoSign) {
          this.refs.clicktoSign.disabled = false;
        }
      }
    }
  }

  checkSize(force, scale) {
    if (this.refs.padBody && (force || this.refs.padBody && this.refs.padBody.offsetWidth !== this.currentWidth)) {
      this.scale = force ? scale : this.scale;
      this.currentWidth = this.refs.padBody.offsetWidth;
      this.refs.canvas.width = this.currentWidth * this.scale;
      this.refs.canvas.height = this.refs.padBody.offsetHeight * this.scale;
      const ctx = this.refs.canvas.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale((1 / this.scale), (1 / this.scale));
      ctx.fillStyle = this.signaturePad.backgroundColor;
      ctx.fillRect(0, 0, this.refs.canvas.width, this.refs.canvas.height);
      this.signaturePad.clear();

      if (this.dataValue) {
        this.setDataToSigaturePad();
      }
    }
  }

  renderElement(value, index) {
    // return this.renderTemplate('signature', {
    return this.renderTemplate('customSignatureTemp', {
      element: super.renderElement(value, index),
      required: _.get(this.component, 'validate.required', false),
    });
  }

  get hasModalSaveButton() {
    return false;
  }

  getModalPreviewTemplate() {
    return this.renderTemplate('modalPreview', {
      previewText: this.dataValue ?
        `<img src=${this.dataValue} ref='openModal' style="width: 100%;height: 100%;" />` : this.t('Click to Sign')
    });
  }

  attach(element) {
    this.loadRefs(element, {
      canvas: 'single',
      refresh: 'single',
      padBody: 'single',
      signatureImage: 'single',
      clicktoSign: 'single',
      value:'single'
    });
    const superAttach = super.attach(element);

    if (this.refs.refresh && this.options.readOnly) {
      this.refs.refresh.classList.add('disabled');
      if (this.refs.clicktoSign) {
        this.refs.clicktoSign.disabled = true;
      }
    }

    // Create the signature pad.
    if (this.refs.canvas) {
      this.signaturePad = new SignaturePad(this.refs.canvas, {
        minWidth: this.component.minWidth,
        maxWidth: this.component.maxWidth,
        penColor: this.component.penColor,
        backgroundColor: this.component.backgroundColor
      });

      this.signaturePad.onEnd = () => this.setValue(this.signaturePad.toDataURL());
      this.refs.signatureImage.setAttribute('src', this.signaturePad.toDataURL());

      this.onDisabled();

      // Ensure the signature is always the size of its container.
      if (this.refs.padBody) {
        if (!this.refs.padBody.style.maxWidth) {
          this.refs.padBody.style.maxWidth = '100%';
        }

        this.addEventListener(window, 'resize', _.debounce(() => this.checkSize(), 100));
        setTimeout(function checkWidth() {
          if (this.refs.padBody && this.refs.padBody.offsetWidth) {
            this.checkSize();
          } else {
            setTimeout(checkWidth.bind(this), 200);
          }
        }.bind(this), 200);
      }
    }
    this.addEventListener(this.refs.clicktoSign, 'click', (event) => {
      event.preventDefault();
      this.showCanvas(true);
      this.signaturePad.clear();
      var canvas = document.createElement("canvas");
      canvas.width = this.refs.canvas.width;
      canvas.height = this.refs.canvas.height;
      var ctx = canvas.getContext('2d');
      ctx.font = "35px Cursive";
      var text = window.form.firstName + ' ' + window.form.lastName;
      ctx.fillText(text, 10, 80);
      this.setValue(canvas.toDataURL());
    });

    this.addEventListener(this.refs.refresh, 'click', (event) => {
      event.preventDefault();
      this.showCanvas(true);

      this.signaturePad.clear();
      this.setValue(this.defaultValue);
    });
    this.setValue(this.dataValue);
    return superAttach;
  }
  /* eslint-enable max-statements */

  detach() {
    if (this.signaturePad) {
      this.signaturePad.off();
    }
    this.signaturePad = null;
    this.currentWidth = 0;
    super.detach();
  }

  getValueAsString(value) {
    return value ? 'Yes' : 'No';
  }

  focus() {
    this.refs.padBody.focus();
  }

  setDataToSigaturePad() {
    this.signaturePad.clear();
    this.signaturePad.fromDataURL(this.dataValue, {
      ratio: 1,
      width: this.refs.canvas.width,
      height: this.refs.canvas.height,
    });
  }
}
Formio.Components.addComponent("signature", SignatureComponent);
