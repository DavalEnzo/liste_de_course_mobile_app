import {
    GluestackUIProvider,
    Heading,
    Center,
    View,
    Image,
    Text,
    Button,
    ButtonText, Card, Input, InputField, ButtonIcon, AddIcon, TrashIcon, CheckIcon, CloseIcon
} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config'; // Optional if you want to use default theme
import {KeyboardAvoidingView, ScrollView, StyleSheet, TouchableOpacity} from "react-native";
import axios from "axios";
import {useEffect, useRef, useState} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import {API_IP} from "@env"

export default function App() {

    const [users, setUsers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [user, setUser] = useState(null);
    const [value, setValue] = useState('');
    const [quantity, setQuantity] = useState('1');

    useEffect(() => {
        getUsers()
    }, []);

    const getUsers = async () => {
        try {
            const response = await axios.get(`https://${API_IP}/api/users`);
            if (response.data) setUsers(response.data);

            const userStorage = await AsyncStorage.getItem("user");
            if (userStorage) {
                const storedUser = JSON.parse(userStorage);
                setUser(storedUser);

                const coursesResponse = await axios.get(`https://${API_IP}/api/courses/${storedUser._id}`);
                setCourses(coursesResponse.data);
            }
        } catch (err) {
            console.log(err);
        }
    }

    const selectUser = (user) => {
        return async () => {
            await AsyncStorage.setItem('user', JSON.stringify(user))
            setUser(user)

            axios.get(`https://${API_IP}/api/courses/${user._id}`)
                .then((response) => {
                    setCourses(response.data);
                }).catch((err) => {
                console.log(err);
            });
        }
    }

    const ajouterTache = () => {
        axios.post(`https://${API_IP}/api/courses`, {
            title: value,
            quantity: quantity,
            user: user._id
        }).then((response) => {
            setCourses([...courses, response.data]);
            setValue('');
            setQuantity('1');
            Toast.show({
                type: 'success',
                text1:'Ajout de la tâche',
                text1Style:{fontSize: 15},
                text2: "La tâche a bien été ajoutée",
                text2Style:{fontSize: 13},
            })
        }).catch((err) => {
            console.log(err);
        });
    }

    const removeCourse = (course) => {
        return () => {
            axios.delete(`https://${API_IP}/api/courses/${course._id}`)
                .then(() => {
                    setCourses(courses.filter(c => c._id !== course._id));
                    Toast.show({
                        type: 'success',
                        text1:'Suppression de la tâche',
                        text1Style:{fontSize: 15},
                        text2: "La tâche a bien été supprimée",
                        text2Style:{fontSize: 13},
                    });
                }).catch((err) => {
                console.log(err);
            });
        }
    }

    const updateCourse = (course) => {
        return () => {
            axios.put(`https://${API_IP}/api/courses/${course._id}`, {
                isDone: !course.isDone
            }).then((response) => {
                setCourses(courses.map(c => c._id === course._id ? response.data : c));
                Toast.show({
                    type: 'success',
                    text1:"Modification de l'état de la tâche",
                    text1Style:{fontSize: 15},
                    text2: `La tâche a bien été marquée comme ${course.isDone ? 'en cours' : 'terminée'}`,
                    text2Style:{fontSize: 13},
                });
            }).catch((err) => {
                console.log(err);
            });
        }
    }

    const logout = async () => {
        await AsyncStorage.removeItem('user');
        setUser(null);
        setValue('');
        setQuantity('1');
        setUsers([]);
        setCourses([])
        await getUsers()
    }

    const scrollViewRef = useRef();

    return (
        <GluestackUIProvider config={config}>
            {!user ? (
                <>
                    <Center style={styles.headline} width="100%">
                        <Heading style={{marginBottom: "10%"}}>Qui est-ce ?</Heading>
                        <View style={styles.flexDiv}>
                            {users.map((user, index) => {
                                return (
                                    <View key={index} style={styles.imageDiv}>
                                        <TouchableOpacity onPress={selectUser(user)}>
                                            <Image
                                                size="l" borderRadius="$full"
                                                source={{
                                                    uri: user.profilePicture,
                                                }}
                                                alt={`Profile` + user.name}
                                            />
                                        </TouchableOpacity>
                                        <Text size={'xl'}>{user.name}</Text>
                                    </View>
                                )
                            })}
                        </View>
                    </Center>
                </>
            ) : (
                <KeyboardAvoidingView behavior={"padding"} style={{marginTop: '15%', marginBottom: '5%', flex: 1}}>
                    {courses.length === 0
                        ?
                        <Heading style={{textAlign:'center'}}>Bonjour {user.name}👋{"\n"} Aucune tâche n'a encore été enregistrée</Heading>
                        :
                        <Heading style={{textAlign:'center'}}>Bonjour {user.name}👋{"\n"} Vous avez {courses.filter((course) => course.isDone === false).length} tâche(s) à réaliser</Heading>
                    }
                    <ScrollView
                        ref={scrollViewRef}
                        onContentSizeChange={() => scrollViewRef.current.scrollToEnd({animated: true})}
                        showsVerticalScrollIndicator={false}
                        style={{zIndex: 1}}
                    >
                        <View style={styles.imageDiv}>
                            {courses.map((course, index) => {
                                return (
                                    <Card styme={styles.flexDiv} key={index} size="md" variant="elevated" m="$3">
                                        <View minWidth='90%' maxWidth="90%" style={{
                                            flexDirection: 'row',
                                            gap: 4,
                                            justifyItems: 'center',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: "hidden"
                                        }}>
                                            <View width={'80%'}
                                                  style={{
                                                      flex: 1,
                                                      flexDirection: 'row',
                                                      justifyContent: 'space-between'
                                                  }}>
                                                <Text style={{marginRight: '2%'}} size="sm">{course.title}</Text>
                                            </View>
                                            <View style={{flex:1, flexDirection:"row", justifyContent:"flex-end", alignContent:"center", alignItems:"center", gap: 4}}>
                                                <View height='10px' style={styles.verticleLine}><Text></Text></View>
                                                <View>
                                                    <Text size="sm">x{course.quantity}</Text>
                                                </View>
                                                <View height='10px' style={styles.verticleLine}><Text></Text></View>
                                                <Button
                                                    size="xs"
                                                    variant="solid"
                                                    isDisabled={false}
                                                    isFocusVisible={false}
                                                    onPress={updateCourse(course)}
                                                    style={{marginLeft:"10%", backgroundColor:`${course.isDone ? '#ffc107' : 'green'}`}}
                                                >
                                                    <ButtonIcon style={{color:`${course.isDone ? 'black' : 'white'}`}} as={course.isDone ? CloseIcon : CheckIcon}></ButtonIcon>
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    variant="solid"
                                                    action="negative"
                                                    isDisabled={false}
                                                    isFocusVisible={false}
                                                    onPress={removeCourse(course)}
                                                >
                                                    <ButtonIcon as={TrashIcon}></ButtonIcon>
                                                </Button>
                                            </View>
                                        </View>
                                    </Card>
                                )
                            })}
                        </View>
                    </ScrollView>

                    <Center>
                        <View style={{width: '60%'}}>
                            <View style={{flex: 1, flexDirection: 'row', gap: 10, marginBottom: "20%"}}>
                                <Input width="70%" variant="outline" size="lg" isDisabled={false} isInvalid={false}
                                       isReadOnly={false}>
                                    <InputField
                                        placeholder='Ajouter une course'
                                        value={value}
                                        onChangeText={setValue}
                                    />
                                </Input>
                                <Input width="20%" variant="outline" size="lg" isDisabled={false} isInvalid={false}
                                       isReadOnly={false}>
                                    <InputField
                                        placeholder='Ajouter une course'
                                        keyboardType="numeric"
                                        value={quantity}
                                        style={{textAlign: 'center'}}
                                        onChangeText={setQuantity}
                                        onSubmitEditing={ajouterTache}
                                    />
                                </Input>
                                <Button
                                    size="lg"
                                    variant="solid"
                                    action="positive"
                                    isDisabled={false}
                                    isFocusVisible={false}
                                    onPress={ajouterTache}
                                    width="10%"
                                >
                                    <ButtonIcon as={AddIcon}></ButtonIcon>
                                </Button>
                            </View>

                            <Center>
                                <Button
                                  size="md"
                                  variant="solid"
                                  action="negative"
                                  isDisabled={false}
                                  isFocusVisible={false}
                                  onPress={logout}
                                  style={{width:'70%', marginLeft:'auto', marginRight:'auto'}}
                                >
                                    <ButtonText>Se déconnecter</ButtonText>
                                </Button>
                            </Center>

                        </View>
                    </Center>
                    <Toast />
                </KeyboardAvoidingView>
            )}
        </GluestackUIProvider>
    );
}

const styles = StyleSheet.create({
    headline: {
        height: '25%',
        marginTop: '70%'
    },
    flexDiv: {
        flex: 1,
        width: "70%",
        flexDirection: "row",
        alignContent: "center",
        alignItems: "center"
    },
    imageDiv: {
        flex: 1,
        alignContent: "center",
        alignItems: "center",
    },
    verticleLine: {
        width: 1,
        backgroundColor: '#909090',
    }
});
