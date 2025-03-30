import React, {useState} from 'react';
import {ChakraProvider, Box, Text, Input, Button, Image, useToast} from '@chakra-ui/react';
import {supabase} from '../utils/supabaseClient';
import {useRouter} from "next/router";
import Head from "next/head.js";

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();
    const router = useRouter();

    const handleLogin = async () => {
        const trimmedUsername = username.trim();
        const trimmedPassword = password.trim();


        if (!trimmedUsername || !trimmedPassword) {
            toast({
                title: "Hiányzó adatok",
                description: "Kérlek, töltsd ki a felhasználónevet és a jelszót!",
                status: "warning",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        setIsLoading(true);

        try {

            const {data: profile, error: profileError} = await supabase
                .from('profiles')
                .select('email')
                .ilike('username', trimmedUsername)
                .maybeSingle();

            if (profileError) {
                throw new Error("Hiba a profil lekérdezésekor: " + profileError.message);
            }

            if (!profile) {
                toast({
                    title: "Hiba",
                    description: "A megadott felhasználónév nem létezik.",
                    status: "warning",
                    duration: 5000,
                    isClosable: true,
                });
                return;
            }


            const {error} = await supabase.auth.signInWithPassword({
                email: profile.email,
                password: trimmedPassword,
            });

            if (error) {
                if (error.message === "Invalid login credentials") {
                    toast({
                        title: "Helytelen adatok",
                        description: "Hibás felhasználónév vagy jelszó.",
                        status: "warning",
                        duration: 5000,
                        isClosable: true,
                    });
                } else {
                    throw new Error("Bejelentkezési hiba: " + error.message);
                }
                return;
            }


            toast({
                title: "Sikeres bejelentkezés",
                description: "Sikeresen bejelentkeztél!",
                status: "success",
                duration: 5000,
                isClosable: true,
            });
            router.push("/auth");

        } catch (error) {
            console.error(error);
            toast({
                title: "Hiba",
                description: "Valami probléma történt. Kérlek, próbáld újra később!",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ChakraProvider resetCSS>
            <Head>
                <title>Xcape - Bejelentkezés</title>
                <link rel="icon" href="/images/icon.png"/>
                <meta name="description" content="Jelentkezz be az XCape oldalra"/>
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
                            Bejelentkezés
                        </Text>
                        <Input
                            mt={5}
                            placeholder="Felhasználónév"
                            fontSize={{base: "sm", md: "15px"}}
                            borderRadius={10}
                            opacity={1}
                            color="#000000"
                            backgroundColor="white"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            width={{base: "100%", md: "auto"}}
                            isDisabled={isLoading}
                        />
                        <Input
                            mt={5}
                            placeholder="Jelszó"
                            fontSize={{base: "sm", md: "15px"}}
                            borderRadius={10}
                            opacity={1}
                            backgroundColor="white"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            width={{base: "100%", md: "auto"}}
                            isDisabled={isLoading}
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
                            onClick={handleLogin}
                            isLoading={isLoading}
                            loadingText="Bejelentkezés..."
                        >
                            Bejelentkezés
                        </Button>
                        <Text
                            mt={3}
                            fontSize={{base: "sm", md: "14px"}}
                            fontWeight="bold"
                            textAlign="center"
                        >
                            Nincs még fiókod? <a href="/signup"
                                                 style={{color: "blue", fontWeight: "bold"}}>Regisztráció</a>
                        </Text>
                    </Box>
                </Box>
            </Box>
        </ChakraProvider>
    );
};

export default Login;