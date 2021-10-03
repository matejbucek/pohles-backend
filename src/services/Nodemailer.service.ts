import { Constant, Injectable, OnInit } from "@tsed/di";
import { NodemailerConfig } from "./Nodemailer.config";
import * as nodemailer from 'nodemailer';
import SMTPTransport from "nodemailer/lib/smtp-transport";
import Mail from "nodemailer/lib/mailer";
import moment from "moment";
import ejs from "ejs";
import path from "path";

@Injectable()
export class NodemailerService implements OnInit{
    @Constant("nodemailer")
    config: NodemailerConfig;

    private _transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;

    private _testAccount: nodemailer.TestAccount;

    $onInit(){
        if (!this.config.transport) {
            // Generate test SMTP service account from ethereal.email
            // Only needed if you don't have a real mail account for testing
            nodemailer.createTestAccount((err, testAccount) => {
                if (err) {
                    return console.error(err);
                }
                this._testAccount = testAccount;
                console.log(testAccount);
                // create reusable transporter object using the default SMTP transport
                this._transporter = nodemailer.createTransport({
                    host: testAccount.smtp.host,
                    port: testAccount.smtp.port,
                    secure: testAccount.smtp.secure,
                    auth: {
                        user: testAccount.user, // generated ethereal user
                        pass: testAccount.pass, // generated ethereal password
                    },
                });
                this.transporterVerify();
                this.sendTestMail();
            });
        } else {
            this._transporter = nodemailer.createTransport(
                this.config.transport,
                this.config.defaults
            );
            this.transporterVerify();
        }
    }

    private transporterVerify() {
        this._transporter.verify((error) => {
            if (error) {
                return console.error(error);
            }
            console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')} Nodemailer: Server is ready to take our messages`);
        })
    }

    public async sendTestMail() {
        // send mail with defined transport object
        let info = await this._transporter.sendMail({
            from: `"Fred Foo 👻" <${this._testAccount.user}>`, // sender address
            to: "matuska.lukas@lukasmatuska.cz", // list of receivers
            subject: "Hello ✔", // Subject line
            text: "Hello world?", // plain text body
            html: "<b>Hello world?</b>", // html body
        });

        console.log("Message sent: %s", info.messageId);
        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

        // Preview only available when sending through an Ethereal account
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }

    //this.nodeMailerService.sendAndParse("email@seznam.cz", "Testovací email", "test.ejs", {"text": "Hello, World!"});
    public async sendAndParse(to: string, subject: string, fileName: string, data: object, options?: object){
        this.sendHtml(to, subject, await this.parse(fileName, data, options));
    }

    public async sendHtml(to: string, subject: string, html: string) {
        // send mail with defined transport object
        let info = await this._transporter.sendMail({
            from: this.config.sender, // sender address
            to: to, // list of receivers
            subject: subject, // Subject line
            html: html, // html body
        });

        console.log("Message sent: %s", info.messageId);

        // Preview only available when sending through an Ethereal account
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }

    /*public send(mailOptions: Mail.Options) {
        this._transporter.sendMail(mailOptions);
    }*/


    private parse(fileName: string, data: object, options?: object){
        return ejs.renderFile(path.resolve(`src/templates/${fileName}`), data, options);
    }
}
