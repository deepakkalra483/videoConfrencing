const express = require("express");
const app = express();

const socket = require("socket.io");

const server = app.listen(3000, () => {
  console.log("servre is running");
});

const io = socket(server);

// socket io work

var userConnection = [];

io.on("connection", (socket) => {
  socket.on("users_info_to_signaling_server", (data) => {
    var other_users = userConnection.filter(
      (p) => p.meeting_id == data.meeting_id
    );
    userConnection.push({
      connectiondId: socket.id,
      user_id: data.current_user_name,
      meeting_id: data.meeting_id,
    });

    other_users.forEach((v) => {
      socket.to(v.connectiondId).emit("other_users_to_inform", {
        other_users_id: data.current_user_name,
        connId: socket.id,
      });
    });

    socket.emit("newConnectionInformation", other_users);
  });

  socket.on("connect_error", (err) => {
    console.log(`connect_error due to ${err.message}`);
  });

  socket.on("sdpProcess", (data) => {
    console.log(`message is receive ${data.message}`);
    socket.to(data.to_connid).emit("sdpProcess", {
      message: data.message,
      from_connid: socket.id,
      streamType: data.streamType,
    });
  });

  socket.on("disconnect", function () {
    var disUsers = userConnection.find((p) => p.connectiondId == socket.id);
    if (disUsers) {
      var meeting_id = disUsers.meeting_id;
      userConnection = userConnection.filter(
        (p) => p.connectiondId != socket.id
      );
      var restUser = userConnection.filter((p) => p.meeting_id == meeting_id);
      restUser.forEach((n) => {
        socket.to(n.connectiondId).emit("closeConnectionInfo", socket.id);
      });
    }
  });

  socket.on("leave", function (data) {
    var disUsers = userConnection.find((p) => p.connectiondId == data.conId);
    if (disUsers) {
      var meeting_id = disUsers.meeting_id;
      userConnection = userConnection.filter(
        (p) => p.connectiondId != data.conId
      );
      var restUser = userConnection.filter((p) => p.meeting_id == meeting_id);
      restUser.forEach((n) => {
        socket.to(n.connectiondId).emit("closeConnectionInfo", data.conId);
      });
    }
  });


});

io.on("error", (error) => {
  console.error("connect_error", error);
});
