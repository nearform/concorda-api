'use strict'

const _ = require('lodash')
const FS = require('fs')
const Path = require('path')
const Ejs = require('ejs')

module.exports = function (opts) {
  var seneca = this

  var options = {}
  options = _.extend(options, opts || {}, {name: 'concorda-email'})

  function sendEmail (msg, response) {
    let context = this

    var mailOptions = {
      role: 'mail',
      cmd: 'send'
    }

    mailOptions.to = msg.to
    mailOptions.bcc = msg.bcc
    mailOptions.cc = msg.cc
    mailOptions.content = msg.data
    mailOptions.subject = msg.subject

    if (msg.folder) {
      // this is a custom folder
      let templatePath = Path.join(msg.folder, msg.template, 'html.ejs')

      seneca.log.info('Read email template from custom folder', templatePath)

      var template = FS.readFileSync(templatePath, 'utf8')
      var html = Ejs.render(template, mailOptions.content)
      mailOptions.html = html
    }
    else {
      mailOptions.code = msg.template
    }

    context.act(mailOptions, function (err) {
      if (err) {
        response(err)
      }
      else {
        seneca.log.debug(
          'Mail sent, template name: ', '<' + msg.template + '>',
          ' \n To: ', msg.to || 'No To',
          ' \n CC: ', msg.cc || 'No CC',
          ' \n BCC: ', msg.bcc || 'No BCC')
        response()
      }
    })
  }

  seneca
    .add({
      role: 'email',
      cmd: 'send_email',
      subject: {string$: true, required$: true},
      to: {string$: true, required$: true},
      cc: {string$: true},
      bcc: {string$: true},
      template: {string$: true},
      data: {object$: true}

    }, sendEmail)

  return {
    name: options.name
  }
}
