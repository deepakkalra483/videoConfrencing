import { useState } from "react";
import { Button, Modal, TextInput, View } from "react-native";

const Home = ({ navigation }) => {
    const [meetin_id, setMeeting_id] = useState('');
    const [visible, setVisible] = useState(false);
    return (<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Modal
            transparent
            visible={visible}>
            <View style={{ flex: 1 }}
                onStartShouldSetResponder={() => setVisible(false)}>
                <View style={{
                    flex: 0.4,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <TextInput
                        placeholder="meeting id"
                        style={{ fontSize: 16, color: '#000' }}
                        placeholderTextColor={'gray'}
                        onChangeText={(i) => setMeeting_id(i)} />

                    <Button
                        title="submit"
                        onPress={() => {
                            setVisible(false);
                            navigation.navigate('Meeting', { meeting_id: meetin_id })
                        }}
                    />
                </View>
            </View>

        </Modal>
        <Button title="host"
            onPress={() => {
                const id = Math.floor(Math.random() * 1000000).toString().padStart(8, '0');
                navigation.navigate('Meeting', { meeting_id: meetin_id})
            }} />

        <View style={{ marginTop: 20 }}>
            <Button
                title="join"
                onPress={() => setVisible(true)} />
        </View>
    </View>

    )
}
export default Home;