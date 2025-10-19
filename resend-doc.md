# Introduction

> Visualize all the API Keys on the Resend Dashboard.

## What is an API Key

API Keys are secret tokens used to authenticate your requests. They are unique to your account and should be kept confidential.

## Add API Key

You can create a new API Key from the [API Key Dashboard](https://resend.com/api-keys).

1. Click **Create API Key**.
2. Give your API Key a name.
3. Select **Full access** or **Sending access** as the permission.
4. If you select **Sending access**, you can choose the domain you want to restrict access to.

<img alt="Add API Key" src="https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-add.png?fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=1ecfaf7a2d2a780b826f941078e427b5" height={450} width={720} data-og-width="3024" data-og-height="1888" data-path="images/dashboard-api-keys-add.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-add.png?w=280&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=4841d039f5962404980fdeaa815796c3 280w, https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-add.png?w=560&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=e7585dcf4002a2d420e5e8950a50c6a0 560w, https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-add.png?w=840&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=558d60f4749160bcc072714d0a90c4dd 840w, https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-add.png?w=1100&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=a9a3f735cca772a8ab0dd5b634633cc0 1100w, https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-add.png?w=1650&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=7b1aefbbb6c0445762c0ab387cb2ecdd 1650w, https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-add.png?w=2500&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=191d64e93b75d7ab3065a5cea16646f6 2500w" />

<Note>
  For security reasons, you can only view the API Key once. Learn more about
  [API key best practices](/knowledge-base/how-to-handle-api-keys).
</Note>

## Set API Key permissions

There are two different permissions of API Keys:

1. **Full access**: grants access to create, delete, get, and update any resource.
2. **Sending access**: grants access only to send emails.

With API Key permissions, you can isolate different application actions to different API Keys. Using multiple keys, you can view logs per key, detect possible abuse, and control the damage that may be done accidentally or maliciously.

## View all API Keys

The [API Dashboard](https://resend.com/api-keys) shows you all the API Keys you have created along with their details, including the **last time you used** an API Key.

Different color indicators let you quickly scan and detect which API Keys are being used and which are not.

<img alt="View All API Keys" src="https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-view-all.jpg?fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=f195ef7f60a110407e2739f30c10ca2a" data-og-width="2584" width="2584" data-og-height="980" height="980" data-path="images/dashboard-api-keys-view-all.jpg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-view-all.jpg?w=280&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=60ecb81b74328a39b37fa47e8f531039 280w, https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-view-all.jpg?w=560&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=d7b6a12d3bd1f1ae7ba6ad8591a5b3b7 560w, https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-view-all.jpg?w=840&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=6c58f948de72898e3bc242a47d2355ea 840w, https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-view-all.jpg?w=1100&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=706fabc16fbae5e82aba851c31c00493 1100w, https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-view-all.jpg?w=1650&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=42982ddb6cd44974e739c31c78b11a73 1650w, https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-view-all.jpg?w=2500&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=a20d700dab8882cb7370635d5a1ddccc 2500w" />

## Edit API Key details

After creating an API Key, you can edit the following details:

* Name
* Permission
* Domain

To edit an API Key, click the **More options** <Icon icon="ellipsis" iconType="solid" /> button and then **Edit API Key**.

<img alt="View Inactive API Key" src="https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-edit.jpeg?fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=7abe8e055cf311a7f66a40477db7946a" data-og-width="1752" width="1752" data-og-height="878" height="878" data-path="images/dashboard-api-keys-edit.jpeg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-edit.jpeg?w=280&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=c1e27f6ba842a2b5df6542aafb04cb37 280w, https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-edit.jpeg?w=560&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=f3ec4aa3707e107702ee90ed14658158 560w, https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-edit.jpeg?w=840&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=8cf8b26efe7561a42514b8bc0b43661d 840w, https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-edit.jpeg?w=1100&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=c71c2a9e51dcf7b95f107eb39a9515e3 1100w, https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-edit.jpeg?w=1650&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=1a776fb48a6b433eb517397e419aee1c 1650w, https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-edit.jpeg?w=2500&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=6983ee271974c993a358c44289ceecc4 2500w" />

<Info>You cannot edit an API Key value after it has been created.</Info>

## Delete inactive API Keys

If an API Key **hasn't been used in the last 30 days**, consider deleting it to keep your account secure.

<img alt="View Inactive API Key" src="https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-view-inactive.jpg?fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=fa99650454696902100e03b669d3a9c1" data-og-width="2584" width="2584" data-og-height="980" height="980" data-path="images/dashboard-api-keys-view-inactive.jpg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-view-inactive.jpg?w=280&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=5d1122d27cd32e2d916ee06761a9079f 280w, https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-view-inactive.jpg?w=560&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=cab07c70b961928cbb7e44049a06d19e 560w, https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-view-inactive.jpg?w=840&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=368afaea3ac78f34a894d1381d918367 840w, https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-view-inactive.jpg?w=1100&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=b52e4953ff371852abafdb87c442e50e 1100w, https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-view-inactive.jpg?w=1650&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=f3a1f23534d3b8ece3e62d7af96d2051 1650w, https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-view-inactive.jpg?w=2500&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=7e5776d2a042133044f69ecd6e667384 2500w" />

You can delete an API Key by clicking the **More options** <Icon icon="ellipsis" iconType="solid" /> button and then **Remove API Key**.

<img alt="Delete API Key" src="https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-remove.jpeg?fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=9fc76ff5dc4cd38f465539cd3a435706" data-og-width="2649" width="2649" data-og-height="980" height="980" data-path="images/dashboard-api-keys-remove.jpeg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-remove.jpeg?w=280&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=79b2a814dfabf620f1d05e8efb722130 280w, https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-remove.jpeg?w=560&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=d833c68507635e0003ae837ef2854c2b 560w, https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-remove.jpeg?w=840&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=ad1dc55cd2378a42a9b3e3760714c64e 840w, https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-remove.jpeg?w=1100&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=ae199ea0e47bd3b219d726369c6eec46 1100w, https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-remove.jpeg?w=1650&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=4ea45648adba2a329bf3d3c1d05aeb5d 1650w, https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-remove.jpeg?w=2500&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=257296f43bfde297ca68d90b51168d03 2500w" />

## View API Key logs

When visualizing an active API Key, you can see the **total number of requests** made to the key. For more detailed logging information, select the underlined number of requests to view all logs for that API Key.

<img alt="View Active API Key" src="https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-view-active.jpg?fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=e0c0584545565e1e78e460b240d2c221" data-og-width="2584" width="2584" data-og-height="980" height="980" data-path="images/dashboard-api-keys-view-active.jpg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-view-active.jpg?w=280&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=1beb0efb48ff143ba79fee5090254cdb 280w, https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-view-active.jpg?w=560&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=68ab16f2b4889324cc7553ce644ffc08 560w, https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-view-active.jpg?w=840&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=f6a1617f1033ec13d63c49d6359c85be 840w, https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-view-active.jpg?w=1100&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=8a85c9c133c1c185d3369813f31b3c8b 1100w, https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-view-active.jpg?w=1650&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=5991f8d2f8c37077457a12c004d25ea0 1650w, https://mintcdn.com/resend/ABWmVTZIHGIFNTFD/images/dashboard-api-keys-view-active.jpg?w=2500&fit=max&auto=format&n=ABWmVTZIHGIFNTFD&q=85&s=57cbd4dbcdc1637bd217e74fd8ff3232 2500w" />

## Export your data

Admins can download your data in CSV format for the following resources:

* Emails
* Broadcasts
* Contacts
* Domains
* Logs
* API keys

<Info>Currently, exports are limited to admin users of your team.</Info>

To start, apply filters to your data and click on the "Export" button. Confirm your filters before exporting your data.

<video autoPlay muted loop playsinline className="w-full aspect-video" src="https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/exports.mp4?fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=1149ee4e83b4414e75a0ecaa92774c38" data-path="images/exports.mp4" />

If your exported data includes 1,000 items or less, the export will download immediately. For larger exports, you'll receive an email with a link to download your data.

All admins on your team can securely access the export for 7 days. Unavailable exports are marked as "Expired."

<Note>
  All exports your team creates are listed in the
  [Exports](https://resend.com/exports) page under **Settings** > **Team** >
  **Exports**. Select any export to view its details page. All members of your
  team can view your exports, but only admins can download the data.
</Note>

