import React, {useState} from 'react';
import {ChakraProvider, Box, Text, Input, Button, Image, useToast} from '@chakra-ui/react';
import {supabase} from '../utils/supabaseClient';
import {useRouter} from 'next/router';
import Head from 'next/head';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const router = useRouter();

    const handleRegister = async () => {
        try {
            if (password.length < 6) {
                toast({
                    title: "A jelszó túl rövid.",
                    description: "A jelszónak legalább 6 karakterből kell álnia.",
                    status: "warning",
                    duration: 5000,
                    isClosable: true,
                });
                return;
            }

            setLoading(true);
            const trimmedUsername = username.trim();

            const {data: existingUsername, error: usernameError} = await supabase
                .from('profiles')
                .select('username')
                .eq('username', trimmedUsername)
                .maybeSingle();

            if (usernameError) {
                throw new Error('Error checking username availability');
            }

            if (existingUsername) {
                throw new Error('Username already taken');
            }

            const {data: existingEmail, error: emailError} = await supabase
                .from('profiles')
                .select('email')
                .eq('email', email)
                .maybeSingle();

            if (emailError) {
                throw new Error('Error checking email availability');
            }

            if (existingEmail) {
                throw new Error('Email already registered');
            }

            const {data: authData, error: authError} = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username: trimmedUsername
                    }
                }
            });

            if (authError) {
                throw authError;
            }

            if (!authData.user) {
                throw new Error('User creation failed');
            }

            const {error: profileError} = await supabase
                .from('profiles')
                .upsert({
                    id: authData.user.id,
                    username: trimmedUsername,
                    email: email
                }, {
                    onConflict: 'id'
                });

            if (profileError) {
                throw profileError;
            }

            toast({
                title: "Sikeres regisztráció",
                description: "Sikeresen regisztráltad a fiókodat!",
                status: "success",
                duration: 5000,
                isClosable: true,
            });

            router.push('/');

        } catch (error) {
            console.error("Registration error:", error);
            toast({
                title: "Error",
                description: error.message || "Valami nem jó",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ChakraProvider resetCSS>
            <Head>
                <title>Xcape - Regisztráció</title>
                <link rel="icon" href="/images/icon.png"/>
                <meta name="description" content="Regisztrálj az XCape oldalra"/>
            </Head>
            <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                minHeight="100vh"
                backgroundColor="white.100"
                p={{base: 4, md: 0}}
            >
                <Box
                    display="flex"
                    w={{base: "100%", md: "720px"}}
                    maxHeight={{base: "auto", md: "450px"}}
                    borderRadius={10}
                    backgroundColor="whiteAlpha.500"
                    flexDirection={{base: "column", md: "row"}}
                    boxShadow="lg"
                >
                    <Image
                        height={{base: "auto", md: "400px"}}
                        maxHeight={{base: "200px", md: "400px"}}
                        width={{base: "100%", md: "350px"}}
                        maxWidth={{base: "100%", md: "350px"}}
                        borderRadius={{base: "10px 10px 0 0", md: "10px 0px 0px 10px"}}
                        src="/images/navbar.png"
                        boxShadow="md"
                        objectFit="contain"
                    />
                    <Box
                        minHeight={{base: "auto", md: 400}}
                        width={{base: "100%", md: "350px"}}
                        display="flex"
                        p={{base: 4, md: 5}}
                        backgroundColor="#f3f3f3"
                        borderRadius={{base: "0 0 10px 10px", md: "0px 10px 10px 0px"}}
                        justifyContent="flex-start"
                        alignItems="center"
                        flexDirection="column"
                    >
                        <Text
                            fontWeight="bold"
                            fontSize={{base: "xl", md: "25px"}}
                            mb={{base: 4, md: 0}}
                        >
                            Regisztráció
                        </Text>
                        <Input
                            mt={5}
                            placeholder="Felhasználónév"
                            fontSize={{base: "sm", md: "15px"}}
                            borderRadius={10}
                            color="#000000"
                            backgroundColor="white"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            isDisabled={loading}
                            width={{base: "100%", md: "auto"}}
                        />
                        <Input
                            mt={5}
                            placeholder="Email"
                            fontSize={{base: "sm", md: "15px"}}
                            borderRadius={10}
                            color="#000000"
                            backgroundColor="white"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            isDisabled={loading}
                            width={{base: "100%", md: "auto"}}
                        />
                        <Input
                            mt={5}
                            placeholder="Jelszó"
                            fontSize={{base: "sm", md: "15px"}}
                            borderRadius={10}
                            backgroundColor="white"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            isDisabled={loading}
                            width={{base: "100%", md: "auto"}}
                        />
                        <Button
                            variant="solid"
                            size={{base: "md", md: "lg"}}
                            mt={10}
                            minWidth={{base: "150px", md: "200px"}}
                            borderRadius={10}
                            backgroundColor="#333333"
                            color="white"
                            _hover={{backgroundColor: "#444444"}}
                            onClick={handleRegister}
                            isLoading={loading}
                            isDisabled={!username || !email || !password || loading}
                        >
                            Regisztrálok
                        </Button>
                        <Text
                            mt={3}
                            fontSize={{base: "sm", md: "14px"}}
                            fontWeight="bold"
                            textAlign="center"
                        >
                            Már van fiókod? <a href="/login" style={{color: "blue", fontWeight: "bold"}}>Jelentkezz
                            be!</a>
                        </Text>
                    </Box>
                </Box>
            </Box>
        </ChakraProvider>
    );
};

export default Register;