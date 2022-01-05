const SelectComponent = Formio.Components.components.select;
class BarcodeSelectComponent extends SelectComponent {

  static schema(...extend) {
    return SelectComponent.schema({
      type: 'barcodeselect',
      label: 'Select',
      key: 'select',
      idPath: 'id',
      data: {
        values: [],
        json: '',
        url: '',
        resource: '',
        custom: ''
      },
      clearOnRefresh: false,
      limit: 100,
      dataSrc: 'values',
      valueProperty: '',
      lazyLoad: true,
      filter: '',
      searchEnabled: true,
      searchField: '',
      minSearch: 0,
      readOnlyValue: false,
      authenticate: false,
      ignoreCache: false,
      template: '<span>{{ item.label }}</span>',
      selectFields: '',
      searchThreshold: 0.3,
      uniqueOptions: false,
      tableView: true,
      fuseOptions: {
        include: 'score',
        threshold: 0.3,
      },
      customOptions: {},
      useExactSearch: false,
    }, ...extend);
  }

  static get builderInfo() {
    return {
      title: 'Select',
      group: 'premium',
      icon: 'th-list',
      weight: 70,
      documentation: '/userguide/#select',
      schema: BarcodeSelectComponent.schema()
    };
  }

  render() {
    let id = '#' + $(this)[0].id;
    $(document).ready(function () {
      if (id) {
        $('.dropdown').each(function (obj) {
          if ($(this)[0].offsetParent && $(this)[0].offsetParent.parentNode) {
            let classlist = $(this)[0].offsetParent.parentNode.className;
            if (classlist) {
              if (classlist.includes('barcodeselect')) {
                if ($(this).find('.barcode-icon').length == 0) {
                  $(this).prepend("<div class='barcode-icon'><i class='fa fa-barcode'></i></div>")
                  $(this).css("display", "inline-flex");
                  $(".barcode-icon").css("display", "flex");
                  $(".barcode-icon").css("align-items", "center");
                  $(".choices__list--single").css("margin-left", "15px");
                }
              }
            }
          }
        });
      }
    });
    return super.render();
  }

  attach(element) {
    let ret = super.attach(element);
    let componentObj = this;
    $(document).off().on('click', '.barcode-icon', (event) => {

      $(document).ready(function () {
        $(".choices__list--dropdown").removeClass("is-active");
        let id = event.currentTarget.offsetParent.childNodes[1].id;
        if (id) {
          let eventCustom = new CustomEvent('openBarcode', {
            detail: {
              compObj: componentObj,
              controlId: id
            }
          });
          document.dispatchEvent(eventCustom);
        }
      })

    });

    document.addEventListener('barcodeScannedData', (e) => {
      if (e.detail) {
        let idArr = e.detail.componentID.split('-');
        if (formObj.getComponentById(idArr[0]) != null) {
          if (formObj.getComponentById(idArr[0]).type && formObj.getComponentById(idArr[0]).type == "barcodeselect") {
              let selectOptions;
              let temp;
              let obj;
              let comp = formObj.getComponentById(idArr[0]);
              if ((comp.component.dataSrc === 'masterdata') && comp.component.masterdata) {
                selectOptions = comp.component.masterdata;
                // obj = {
                //   value: e.detail.scannedData,
                //   label: e.detail.scannedData,
                //   id: String(selectOptions.length)
                // }

                temp = selectOptions.filter((data) => {
                  return data[comp.component.valueProperty] == e.detail.scannedData
                })
                obj = temp;

              }else{
                selectOptions = comp.selectOptions;
               obj = {
                  value: e.detail.scannedData,
                  label: e.detail.scannedData,
                  id: String(selectOptions.length)
                }

                temp = selectOptions.filter((data) => {
                  return data.value == obj.value
                })
              }
              if (temp && temp.length > 0) {
                if (obj) {
                  if ((comp.component.dataSrc === 'masterdata')){
                    formObj.getComponentById(idArr[0]).setItems(temp)
                    formObj.getComponentById(idArr[0]).setValue(temp[0][comp.component.valueProperty])
                  }else{
                    formObj.getComponentById(idArr[0]).setValue(temp[0].value)
                  }
                  $(".barcode-select-error").remove();
                }
              } else {
                $(document).ready(function () {
                  formObj.getComponentById(idArr[0]).resetValue()
                  $(".barcode-select-error").remove();
                  let id = "#" + formObj.getComponentById(idArr[0]).element.id
                  $(id).append("<p class ='text-danger barcode-select-error'><span>" + e.detail.scannedData + "&nbsp;is not Found</span></p>");
                });
              }
              $(document).ready(function () {
                $('.formio-errors').each(function (obj) {
                  if ($(this).find('.error').length == 0) {
                    $(this).css('display', 'none');
                  }
                });
              });
              $(".choices__list--dropdown").removeClass("is-active");

            if (formObj.getComponentById(idArr[0]).component.publishEvents) {
              // publish event 
              if (formObj.getComponentById(idArr[0]).component.eventName != undefined) {
                componentObj.emit(componentObj.component.eventName, {
                  detail: e.detail.scannedData
                })
              }
            }
          }
        }
      }
    },false);
    return ret;
  }
}
Formio.registerComponent('barcodeselect', BarcodeSelectComponent);
