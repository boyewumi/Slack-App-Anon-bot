// TEST FOR /ask FAIL

// it(`/ask should reply the ask message as a public message`, async () => {
//   const usersListResponse = {
//     ok: true,
//     messages: [
//       {
//         type: "message",
//         user: "U012AB3CDE",
//         text: "I find you punny and would like to smell your nose letter",
//         ts: "1512085950.000216"
//       },
//       {
//         type: "message",
//         user: "U061F7AUR",
//         text: "What, you want to smell my shoes better?",
//         ts: "1512104434.000490"
//       }
//     ],
//     has_more: false,
//     pin_count: 0,
//     response_metadata: {
//       next_cursor: "bmV4dF90czoxNTEyMDg1ODYxMDAwNTQz"
//     }
//   };
//   this.controller.axiosMockAdapter
//     .onGet("conversations.history")
//     .reply(200, usersListResponse);
//   UserMock.expects("find")
//     .withArgs({ user_id: "user123" })
//     .returns([
//       {
//         is_banned: false
//       }
//     ]);

//   const text = "This is my anonymous question";
//   const response_url = "response_url/public";
//   await this.controller.usersInput([
//     {
//       type: "slash_command",
//       user: this.userInfo.slackId, //user required for each direct message
//       channel: this.userInfo.channel, // user channel required for direct message
//       messages: [
//         {
//           command: "/ask",
//           text: text,
//           isAssertion: true,
//           response_url,
//           team_id: "test"
//         }
//       ]
//     }
//   ]);
//   const reply = this.controller.apiLogByKey[response_url][0];
//   assert.strictEqual(reply.text, " This is my anonymous question");
//   assert.strictEqual(
//     reply.channelData.response_type,
//     "in_channel",
//     "should be private message"
//   );
// });
