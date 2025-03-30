import '@/styles/globals.css';
import '@/styles/LoadingAnimation.css';
import {ChakraProvider} from '@chakra-ui/react'
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Review from '@/components/Reviews';

export default function App({Component, pageProps}) {
    return (
        <ChakraProvider>
            <Navigation/>
            <Component {...pageProps}/>
            <Review/>
            <Footer/>
        </ChakraProvider>
    );
}