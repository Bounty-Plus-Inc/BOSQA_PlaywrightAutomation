// This is for shared page object behavior.
const { BasePage } = require('../base/BasePage');

class AttachmentPage extends BasePage {
  constructor(page) {
    super(page);
  }

async openAttachmentWindow() {
  const header = await this.findInAllFrames(
    'xpath=//*[@id="divT1"]',
    20
  );

  // Give the form focus
  await header.click();

  await this.page.waitForTimeout(500);

  // Then right click
  await header.click({
    button: "right",
  });


const attachmentMenu = await this.findInAllFrames(
  "xpath=//a[contains(@onclick,'popupFrameAttachments')]",
  20
);

  await attachmentMenu.click();

}

 async uploadAttachment(filePath) {
  // Add attachment
  const addButton = await this.findInAllFrames(
    'xpath=//*[@id="T50_btnUpdate"]',
    20
  );

  await addButton.click();

  // Choose file
  const fileInput = await this.findInAllFrames(
    'xpath=//*[@id="df_filename"]',
    20
  );

  await fileInput.setInputFiles(filePath);

  // Upload
  const uploadButton = await this.findInAllFrames(
    'xpath=/html/body/form/table/tbody/tr/td[2]/table/tbody/tr/td[1]/table/tbody/tr[3]/td/a[1]',
    20
  );

  const uploadPopup = this.page;

  await uploadButton.click();

    await this.page.waitForTimeout(2000);

}
}

module.exports = { AttachmentPage };