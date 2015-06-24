module.exports = {
  gettgname: function(message){
    if(message.from.username){
      return message.from.username;
    } else {
      return message.from.first_name;
    }
  }
}
