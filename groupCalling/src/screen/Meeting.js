import { useRoute } from "@react-navigation/native";
import { useState } from "react";

const { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity } = require("react-native")

const Meeting = ({ route,navigation }) => {
    const[userName,setUsername]=useState('');
    const id = route.params?.meeting_id;
    return (<SafeAreaView style={{flex:1,backgroundColor:'#fff'}}>
        <View style={ styles.idBox}>
            <Text style={{ fontSize: 15, color: '#000' }}>MeetingId:</Text>
            <Text style={{ fontSize: 16, color: 'black', alignSelf: 'center' }}>{id}</Text>
        </View>
        <View style={styles.userNameBox}>
            <TextInput
            placeholder="Enter your userName"
            style={styles.inputBox}
            placeholderTextColor={"gray"}
            onChangeText={
                (i)=> setUsername(i)
            }
             />
            <TouchableOpacity
            activeOpacity={1}
            style={styles.button}
            onPress={()=> navigation.
            navigate('NewStream',
            {
                meeting_id:id,
                username:userName
            })}>
                

            </TouchableOpacity>
        </View>
        </SafeAreaView>

    )
}
const styles=StyleSheet.create({
    idBox:{
      flexDirection:'row',
      height:55,
    },
    userNameBox:{
        flex:1,
      },
      inputBox:{
        fontSize:16,
        color:'#000',
      },
      button:{
        height:45,
        justifyContent:'center',
        alignItems:'center',
        backgroundColor:'red'
      }
})
export default Meeting;