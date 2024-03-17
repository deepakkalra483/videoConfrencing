import {
    View, Text, Button, TouchableOpacity, Dimensions, InteractionManager,
} from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
// import {io} from 'socket.io-client';
import {
    MediaStream, RTCPeerConnection, RTCSessionDescription, RTCView, mediaDevices,
} from 'react-native-webrtc';
import { Notification } from '../assets/component/Notification';
import InCallManager from 'react-native-incall-manager';
import { StopNotification } from '../assets/component/StopNotification';
import IconButton from '../assets/component/Button';
import { SocketContext } from '../socket';
import { io } from 'socket.io-client';
let localStream;
let streamType;
const NewStream = ({ route, navigation }) => {
    const [users, setUsers] = useState([]);
    const [screenShare, setShare] = useState(false);
    // const [streamType, setStreamType] = useState('camera');
    const totalWidth = Dimensions.get('window').width;
    const totalHeight = Dimensions.get('window').height;
    const [RemoteStreams, setRemoteStreams] = useState([]);
    const [tryAgain, setTry] = useState(false);
    const [userStream, setUsersStream] = useState(null);
    const [myId, setMyId] = useState([]);
    const [camera, setCamera] = useState(false);
    const [mute, setMute] = useState(true);
    const [cameraState, setState] = useState(true);
    const [remoteConn, setRemoteConn] = useState([]);
    const [speaker, setSpeaker] = useState(false);
    const [screen, setScreen] = useState(false);
    const [show, setShow] = useState(false);
    const [remoteView, setRemoteView] = useState('camera');
    // const {socket} = useContext(SocketContext);
    let screenStream;
    let meeting_id = route?.params?.meeting_id;
    let username = route?.params?.username;
    let users_connectionID = [];
    let users_connections = [];
    let remoteStream = [];
    let audioStream = [];
    let sdpFunction;
    let socket = io.connect('https://159.89.121.196:5555', {
        jsonp: false, transports: ['websocket'],
    });
    sdpFunction = (data, to_connid, type) => {
        socket.emit('sdpProcess', {
            message: data, to_connid: to_connid, streamType: streamType,
        });
    };
    useEffect(() => {
        return () => {
            StopNotification();
            setShare(false); // Call the function when component is unmounted
        };
    }, []);
    useEffect(() => {
        try {
            InCallManager.start({ media: 'audio' });
            InCallManager.setForceSpeakerphoneOn(speaker);
            InCallManager.setSpeakerphoneOn(speaker);
            InCallManager.setMicrophoneMute(!mute);
        } catch (err) {
            console.log('InApp Caller ---------------------->', err);
        }
    }, [speaker, mute]);
    // Add remote Streams in array
    const addStreams = (connId, stream) => {
        setRemoteStreams(prevStreams => {
            const index = prevStreams.findIndex(item => item.connId === connId);
            if (index !== -1) {
                // If connId already exists, replace the stream
                const updatedStreams = [...prevStreams];
                updatedStreams[index].stream = stream;
                return updatedStreams;
            } else {
                // If connId doesn't exist, add a new entry
                return [...prevStreams, { connId: connId, stream }];
            }
        });
    };
    // Add connections in array
    const addConnections = conn => {
        setRemoteConn(prevStreams => [...prevStreams, conn]);
    };
    // Remove Stream from array if a user leave the call
    const removeStream = connId => {
        setRemoteStreams(prevStreams => prevStreams.filter(user => user.connId !== connId),);
    };
    // for leave call by pressing haungUp button
    const leaveCall = () => {
        console.log('idList---', myId);
        socket.emit('leave', {
            conId: myId[0],
        });
        socket.disconnect();
        StopNotification();
        setShare(false);
        navigation.goBack();
        if (userStream) {
            userStream.getTracks().forEach(track => {
                track.stop();
            });
            setUsersStream(null);
        }
        InCallManager.stop();
    };
    // Switch camera (front & rare)
    const SwitchCam = async () => {
        StopNotification();
        setShare(false);
        if (userStream) {
            userStream.getVideoTracks().forEach(track => {
                track._switchCamera();
            });
        }
    };
    // Stop Screen-Sharing
    const StopShare = () => {
        if (userStream) {
            // setMute(true);
            StopNotification();
            setShare(false);
            userStream.getTracks().forEach(track => track.stop());
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            processMedia(false);
        }
    };
    // Video will be off but voice is audible
    const CameraOff = async () => {
        StopNotification();
        setShare(false);
        cameraState ? setState(false) : setState(true);
        userStream.getVideoTracks().forEach(track => {
            cameraState ? (track.enabled = false) : (track.enabled = true);
        });
    };
    //ScreenShare
    const ScreenShare = async () => {
        if (userStream) {
            streamType = 'screen';
            Notification();
            userStream.getTracks().forEach(track => {
                track.stop();
            });
            const audioStream = await mediaDevices.getUserMedia({ audio: true });
            try {
                const mediaStream = await mediaDevices.getDisplayMedia();
                if (localStream) {
                    localStream.getTracks().forEach(track => {
                        if (track.kind == 'video') {
                            track.stop();
                        }
                    });
                }
                mediaStream.addTrack(audioStream.getAudioTracks()[0]);
                localStream = mediaStream;
                updateCamera(mediaStream);
                setUsersStream(mediaStream);
                setShare(true);
            } catch (err) {
                console.log('screenError---', err);
            }
        }
    };
    // Signaling Socket
    useEffect(() => {
        socket.on('connect', () => {
            console.log('connected');
            if (socket.connected) {
                socket.emit('users_info_to_signaling_server', {
                    current_user_name: username, meeting_id: meeting_id,
                });
            }
            processMedia(true);
        });
        // when new user join then this function call
        socket.on('newConnectionInformation', function (other_users) {
            console.log('new Arrive');
            setMyId(prevDataArray => [...prevDataArray, socket.id]);
            for (let i = 0; i < other_users.length; i++) {
                // addParticipant(other_users[i].user_id);
                createConnection(other_users[i].connectiondId);
            }
        });
        socket.on('sdpProcess', async function (data) {
            setRemoteView(data.streamType);
            // console.log('call-----', data.streamType);
            await sdpProcess(data.message, data.from_connid);
        });
        // this is to inform host that a new user is come
        socket.on('other_users_to_inform', function (data) {
            console.log('new Arrive');
            // addParticipant(data.other_users_id);
            createConnection(data.connId);
        });
        // when a user is closed the application
        socket.on('closeConnectionInfo', function (con_id) {
            removeStream(con_id);
            // console.log(`closed${username}`);
            users_connectionID[con_id] = null;
            users_connections[con_id].close();
            users_connections[con_id] = null;
        });
        socket.on('connect_error', err => {
            console.log(JSON.stringify(err)); // prints the message associated with the error
        });
    }, []);
    // this is update the exsisting Stream in peerConnection
    async function updateCamera(stream) {
        remoteConn.forEach(async connection => {
            if (connection) {
                await stream.getTracks().forEach(async track => {
                    const sender = connection
                        .getSenders()
                        .find(sender => sender.track && sender.track.kind === track.id);
                    if (!sender) {
                        console.log('sender not found-----');
                        await connection.addTrack(track, stream);
                    } else {
                        console.log('senderFound-----'), await Promise.all([
                            connection.removeTrack(sender), connection.addTrack(track, stream),]);
                        console.log('exsist-----');
                    }
                });
            }
        });
    }
    // this is for set Stream in peerConatction
    async function updateMediaSenders(stream) {
        // try {
        for (var con_id in users_connections) {
            var connections = users_connections[con_id];
            if (
                connections &&
                (connections.connectionState == 'new' ||
                    connections.connectionState == 'connecting' ||
                    connections.connectionState == 'connected')
            ) {
                stream?.getTracks()?.forEach(async track => {
                    const sender = users_connections[con_id]
                        .getSenders()
                        .find(sender => sender.track && sender.track.id === track.id);
                    if (!sender) {
                        await users_connections[con_id].addTrack(track, stream);
                    }
                });
            }
        }
    }
    var iceConfig = {
        iceServers: [
            {
                urls: 'stun:stun.l.google.com:19302',
            }, {
                urls: 'stun:stun1.l.google.com:19302',
            }, {
                urls: 'stun:stun2.l.google.com:19302',
            }, {
                urls: 'stun:stun3.l.google.com:19302',
            }, {
                urls: 'stun:stun4.l.google.com:19302',
            },],
    };
    async function createConnection(connId) {
        var connection = new RTCPeerConnection(iceConfig);
        connection.onicecandidate = function (event) {
            if (event.candidate) {
                sdpFunction(
                    JSON.stringify({
                        iceCandidate: event.candidate,
                    }), connId, streamType,);
            }
        };
        connection.onnegotiationneeded = async function (event) {
            await createOffer(connId);
        };
        connection.ontrack = function (event) {
            if (!remoteStream[connId]) {
                remoteStream[connId] = new MediaStream();
            }
            if (!audioStream[connId]) {
                audioStream[connId] = new MediaStream();
            }
            if (event.track.kind == 'video' || event.track.kind == 'audio') {
                const stream = event.streams[0];
                addStreams(connId, stream);
                console.log('id-----', JSON.stringify(event.track));
                // const sender = event?.transceiver?._sender;
                // const track = sender?._track;
                // const facingMode = track?._constraints?.facingMode;
                // console.log('userDetails----', facingMode);
                // console.log('remoteStream----', JSON.stringify(event));
                setShow(true);
            }
        };
        users_connectionID[connId] = connId;
        users_connections[connId] = connection;
        updateMediaSenders(localStream);
        addConnections(connection);
        return connection;
    }
    async function createOffer(connId) {
        var connection = users_connections[connId];
        connection
            .createOffer()
            .then(offer => connection.setLocalDescription(offer))
            .then(() =>
                sdpFunction(
                    JSON.stringify({
                        offer: connection.localDescription,
                    }), connId, streamType,),)
            .catch(err => {
                console.log('create error---', err);
                // handle error
            });
    }
    async function processMedia(first) {
        let isFront = true;
        let fullStream = null;
        streamType = 'camera';
        mediaDevices.enumerateDevices().then(sourceInfos => {
            let videoSourceId;
            for (let i = 0; i < sourceInfos.length; i++) {
                const sourceInfo = sourceInfos[i];
                if (
                    sourceInfo.kind == 'videoinput' &&
                    sourceInfo.facing == (isFront ? 'front' : 'environment')
                ) {
                    videoSourceId = sourceInfo.deviceId;
                }
            }
            mediaDevices
                .getUserMedia({
                    audio: true, video: {
                        mandatory: {
                            minWidth: 500, // Provide your own width, height and frame rate here
                            minHeight: 300, minFrameRate: 30,
                        }, facingMode: isFront ? 'user' : 'environment', optional: videoSourceId ? [{ sourceId: videoSourceId }] : [], sourceInfos: sourceInfos,
                    },
                })
                .then(stream => {
                    console.log('sr', stream);
                    localStream = stream;
                    setUsersStream(stream);
                    if (first) {
                        updateMediaSenders(stream);
                    } else {
                        updateCamera(stream);
                    }
                    // setLocalStream(stream);
                    // stream.getTracks().forEach(track => yourConn.addTrack(track, stream));
                })
                .catch(error => {
                    console.log('error', error);
                    // Log error
                });
        });
    }
    async function sdpProcess(message, from_connid) {
        message = JSON.parse(message);
        if (message.answer) {
            // console.log(`answer----- ${JSON.stringify(message.answer)}`);
            await users_connections[from_connid].setRemoteDescription(
                new RTCSessionDescription(message.answer),);
        } else if (message.offer) {
            // console.log(`offer----- ${JSON.stringify(message.offer)}`);
            if (users_connections[from_connid].signalingState === 'stable') {
                if (!users_connections[from_connid]) {
                    await createConnection(from_connid);
                }
                await users_connections[from_connid].setRemoteDescription(
                    new RTCSessionDescription(message.offer),);
                const answer = await users_connections[from_connid].createAnswer();
                await users_connections[from_connid].setLocalDescription(answer);
                sdpFunction(
                    JSON.stringify({
                        answer: answer,
                    }), from_connid, streamType,
                );
            }
        } else if (message.iceCandidate) {
            // console.log(`iceCandiadte---- ${from_connid}`);
            if (!users_connections[from_connid]) {
                await createConnection(from_connid);
            }
            try {
                await users_connections[from_connid].addIceCandidate(
                    message.iceCandidate,);
            } catch (error) {
                console.log('iceError----', error);
            }
        }
    }
    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <Text
                style={{ fontSize: 16, color: '#000' }}>{`My Id: ${meeting_id}`}</Text>
            <RTCView
                streamURL={userStream && userStream.toURL()}
                style={{
                    flex: 1, backgroundColor: 'black', marginHorizontal: 2, marginBottom: 2,
                }}
                objectFit={screenShare ? 'contain' : 'cover'}
            />
            {RemoteStreams.length != 0 && (<View style={{ flex: 1, flexDirection: 'row' }}>
                {RemoteStreams.map(({ userid, stream }, index) => {
                    return (<RTCView
                        key={index}
                        streamURL={stream && stream.toURL()}
                        mirror={remoteView == 'screen' ? false : true}
                        style={{
                            flex: 1, backgroundColor: 'black', marginHorizontal: 2,
                        }}
                        objectFit={remoteView == 'screen' ? 'contain' : 'cover'}
                    />
                    );
                })} </View>
            )}
            {!screen ? (<View
                style={{
                    backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', height: 65, flexDirection: 'row', borderTopLeftRadius: 15, borderTopRightRadius: 15, position: 'absolute', bottom: 0, width: Dimensions.get('window').width,
                }}>
                <IconButton
                    src={
                        cameraState
                            ? require('../assets/images/camera_enable.png')
                            : require('../assets/images/camera.png')
                    }
                    onPress={() => {
                        setState(!cameraState);
                        CameraOff();
                    }}
                />
                <IconButton
                    src={
                        mute
                            ? require('../assets/images/mic.png')
                            : require('../assets/images/mic_disabled.png')
                    }
                    onPress={() => {
                        setMute(!mute);
                        // Mute();
                    }}
                />
                <IconButton
                    src={
                        speaker
                            ? require('../assets/images/speaker_on.png')
                            : require('../assets/images/speaker_off.png')
                    }
                    onPress={() => {
                        setSpeaker(!speaker);
                    }}
                />
                <IconButton
                    src={require('../assets/images/camera_switch.png')}
                    onPress={() => {
                        setShare(true);
                        setCamera(!camera);
                        SwitchCam();
                    }}
                />
                <IconButton
                    src={require('../assets/images/hang_up.png')}
                    styles={{ tintColor: 'red' }}
                    onPress={() => {
                        leaveCall();
                    }}
                />
                <IconButton
                    src={
                        !screen
                            ? require('../assets/images/screen_disable.png')
                            : require('../assets/images/screen_enable.png')
                    }
                    onPress={() => {
                        ScreenShare();
                        setScreen(!screen);
                    }}
                />
            </View>
            ) : (<View
                style={{
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    justifyContent: 'center', alignItems: 'center', height: 65, flexDirection: 'row', borderTopLeftRadius: 15, borderTopRightRadius: 15, position: 'absolute', bottom: 0, width: Dimensions.get('window').width,
                }}>
                <IconButton
                    src={
                        mute
                            ? require('../assets/images/mic.png')
                            : require('../assets/images/mic_disabled.png')
                    }
                    onPress={() => {
                        setMute(!mute);
                        // Mute();
                    }}
                />
                <IconButton
                    src={
                        speaker
                            ? require('../assets/images/speaker_on.png')
                            : require('../assets/images/speaker_off.png')
                    }
                    onPress={() => {
                        setSpeaker(!speaker);
                    }}
                />
                <IconButton
                    src={require('../assets/images/stop_screen.png')}
                    onPress={() => {
                        StopShare();
                        setScreen(!screen);
                    }}
                />
                <IconButton
                    src={require('../assets/images/hang_up.png')}
                    styles={{ tintColor: 'red' }}
                    onPress={() => {
                        leaveCall();
                    }}
                />
            </View>
            )}
        </View>
    );
};
export default NewStream;