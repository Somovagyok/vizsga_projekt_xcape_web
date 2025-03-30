import {
    Container,
    Text,
    Button,
    Box,
    VStack,
    Heading,
    Image,
    Link,
} from "@chakra-ui/react";
import Head from "next/head";
import React, {useEffect, useState} from "react";
import {supabase} from "../utils/supabaseClient";
import {MdDownload} from "react-icons/md";

export default function DownloadPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const {data: {user}, error} = await supabase.auth.getUser();
                if (error) {
                    console.error("Hiba a felhasználó lekérdezésekor:", error.message);
                    setUser(null);
                } else {
                    setUser(user);
                }
            } catch (err) {
                console.error("Váratlan hiba a felhasználó lekérdezésekor:", err);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();

        const {data: {subscription}} = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription?.unsubscribe();
    }, []);

    return (
        <>
            <Head>
                <title>Xcape - Letöltés</title>
                <link rel="icon" href="/images/icon.png"/>
                <meta name="description" content="Töltsd le az Xcape játékot most!"/>
            </Head>
            <Container maxW="6xl" py={8} minH="100vh" display="flex" alignItems="center" justifyContent="center">
                <VStack spacing={2} textAlign="center">
                    <Image
                        src="/images/download.png"
                        alt="logo"
                        borderRadius="md"
                        marginLeft="55px"
                        marginTop={-150}
                        width={"500px"}
                    />
                    <Heading as="h1" size="2xl">
                        Xcape Letöltés
                    </Heading>
                    <Text fontSize="xl" maxW="600px">
                        Üdvözlünk az Xcape letöltési oldalon! Töltsd le a játékot zip formátumban, csomagold ki, és
                        indulhat a kaland!
                    </Text>
                    {loading ? (
                        <Text>Betöltés...</Text>
                    ) : user ? (
                        <Link
                            href="https://hewnsdjmjmvklrxjquxt.supabase.co/storage/v1/object/public/game//xcapeout.rar"
                            download
                        >
                            <Button
                                bg="gray.800"
                                color="white"
                                _hover={{bg: "gray.700"}}
                                size="lg" mt={4} mb={4}
                            >
                                <MdDownload style={{marginRight: 4}}/>
                                Játék letöltése
                            </Button>
                        </Link>
                    ) : (
                        <Text fontSize="lg" color="black">
                            A letöltéshez jelentkezzen be.{" "}
                            <Link href="/login" fontWeight="bold" color="blue.500">
                                Bejelentkezés
                            </Link>
                        </Text>
                    )}
                    <Text fontSize="sm" color="gray.500">
                        Fájl: xcapeout.rar | Verzió: 1.0.0 | Utolsó frissítés: 2025.03.28.
                    </Text>
                </VStack>
            </Container>
        </>
    );
}