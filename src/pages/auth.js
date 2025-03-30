import React, {useEffect} from 'react';
import {ChakraProvider, Box, Text, Spinner} from '@chakra-ui/react';
import {useRouter} from 'next/router';
import {supabase} from '../utils/supabaseClient';

const Auth = () => {
    const router = useRouter();

    useEffect(() => {
        const checkUserSession = async () => {
            const {data: {session}} = await supabase.auth.getSession();

            if (session) {
                router.push('/');
            } else {
                router.push('/');
            }
        };

        checkUserSession();
    }, [router]);

    return (
        <ChakraProvider>
            <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                height="100vh"
                backgroundColor="white.100"
            >
                <Box textAlign="center">
                    <Spinner size="xl" color="facebook.500"/>
                    <Text mt={4} fontSize="lg" color="gray.600">
                        Folyamatban van a bejelentkezés ellenőrzése...
                    </Text>
                </Box>
            </Box>
        </ChakraProvider>
    );
};

export default Auth;