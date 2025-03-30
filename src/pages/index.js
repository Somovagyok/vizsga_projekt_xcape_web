import {
    Container,
    Text,
    Image,
    Box,
    HStack,
    VStack,
    Button,
    Flex,
    Center,
} from "@chakra-ui/react";
import Head from "next/head";
import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/utils/supabaseClient";

const ImageSlider = ({ currentIndex, isVisible }) => {
    const images = [
        "/images/map.png",
        "/images/or.png",
        "/images/itemek.png",
    ];

    return (
        <Box
            w={{ base: "100%", md: "600px", lg: "700px" }}
            h={{ base: "300px", md: "400px", lg: "450px" }}
            display="flex"
            alignItems="center"
            justifyContent="center"
            position="relative"
            marginRight={{ base: 0, md: 5 }}
            animation={
                isVisible
                    ? "slideInFromLeft 1s ease-out forwards"
                    : "slideOutToLeft 1s ease-out forwards"
            }
            initial={{ opacity: 0, transform: "translateX(-100%)" }}
        >
            <Image
                src={images[currentIndex % images.length]}
                alt="game_pics"
                borderRadius="md"
                position="absolute"
                left="50%"
                top="50%"
                transform="translate(-50%, -50%)"
                width="100%"
                height="100%"
                objectFit="cover"
            />
        </Box>
    );
};

export default function LandingPage() {
    const [users, setUsers] = useState([]);
    const [ratings, setRatings] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const aboutRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    const texts = [
        "Játékunk egy pakisztáni börtönben játszódik. A célunk hogy kijussunk innen.",
        "A kijutás viszont nem olyan könnyű. Ezt őrök nehezítik megik akik ha észrevesznek akkor elkapnak.",
        "Elrejtett tárgyakkal mint például kulcsok, feszítővas segítségével kell kijutnunk.",
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % texts.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [texts.length]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: usersData } = await supabase.from("profiles").select("username, created_at");
                const { data: ratingsData } = await supabase.from("reviews").select("rating");
                setUsers(usersData || []);
                setRatings(ratingsData || []);
            } catch (err) {
                setError("Nem sikerült lekérni az adatokat.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                setIsVisible(entries[0].isIntersecting);
            },
            { threshold: 0.1 }
        );

        if (aboutRef.current) {
            observer.observe(aboutRef.current);
        }

        return () => {
            if (aboutRef.current) {
                observer.unobserve(aboutRef.current);
            }
        };
    }, []);

    const calculateAverageRating = () => {
        if (ratings.length === 0) return "Nincs még értékelés";
        const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
        return (sum / ratings.length).toFixed(1);
    };

    const renderStars = () => {
        if (ratings.length === 0) return "Nincs még értékelés";
        const average = parseFloat(calculateAverageRating());
        const fullStars = Math.floor(average);
        const hasPartialStar = average % 1 > 0;
        const emptyStars = 5 - fullStars - (hasPartialStar ? 1 : 0);

        return (
            <Text as="span" display="flex" alignItems="center" fontSize={{ base: "2xl", md: "4xl" }}>
                {Array(fullStars)
                    .fill("★")
                    .map((star, index) => (
                        <Text as="span" key={`full-${index}`} color="yellow.400">
                            {star}
                        </Text>
                    ))}
                {hasPartialStar && (
                    <Text as="span" color="yellow.400" opacity={0.7}>
                        ✯
                    </Text>
                )}
                {Array(emptyStars)
                    .fill("☆")
                    .map((star, index) => (
                        <Text as="span" key={`empty-${index}`} color="gray.400">
                            {star}
                        </Text>
                    ))}
            </Text>
        );
    };

    const scrollToAbout = () => {
        if (aboutRef.current) {
            const targetPosition = aboutRef.current.getBoundingClientRect().top + window.pageYOffset;
            const windowHeight = window.innerHeight;
            const aboutHeight = aboutRef.current.offsetHeight;
            const adjustedTarget = targetPosition - (windowHeight / 2) + (aboutHeight / 2);
            const startPosition = window.pageYOffset;
            const distance = adjustedTarget - startPosition;
            const duration = 1000;
            let startTime = null;

            const easeInOutQuad = (t, b, c, d) => {
                t /= d / 2;
                if (t < 1) return (c / 2) * t * t + b;
                t--;
                return (-c / 2) * (t * (t - 2) - 1) + b;
            };

            const animation = (currentTime) => {
                if (startTime === null) startTime = currentTime;
                const timeElapsed = currentTime - startTime;
                const run = easeInOutQuad(timeElapsed, startPosition, distance, duration);
                window.scrollTo(0, run);
                if (timeElapsed < duration) requestAnimationFrame(animation);
            };

            requestAnimationFrame(animation);
        }
    };

    return (
        <>
            <Head>
                <title>XCape</title>
                <link rel="icon" href="/images/icon.png" />
            </Head>
            <Container maxW="container.xl" py={{ base: 4, md: 8 }}>
                <Flex
                    flexDirection={{ base: "column", md: "row" }}
                    alignItems="center"
                    justifyContent="center"
                    gap={{ base: 2, md: 4 }}
                >
                    <Box
                        as="div"
                        animation="slideInFromLeft 1s ease-out forwards"
                        initial={{ opacity: 0, transform: "translateX(-100%)" }}
                    >
                        <Image
                            src="/images/logo.png"
                            alt="logo"
                            borderRadius="md"
                            width={{ base: "250px", md: "400px" }}
                        />
                    </Box>
                    <Box
                        as="div"
                        animation="slideInFromRight 1s ease-out forwards"
                        initial={{ opacity: 0, transform: "translateX(100%)" }}
                    >
                        <Text
                            fontSize={{ base: "md", md: "xl" }}
                            mt={{ base: 2, md: 0 }}
                            textAlign="center"
                        >
                            A jövő játékfejlesztői
                        </Text>
                    </Box>
                </Flex>

                <Center mt={{ base: 4, md: 6 }} mb={{ base: "20vh", md: "30vh" }}>
                    <Box
                        as="div"
                        animation="slideInFromBottom 1s ease-out forwards"
                        initial={{ opacity: 0, transform: "translateY(100%)" }}
                    >
                        <button
                            onClick={scrollToAbout}
                            className="button-27"
                        >
                            Tovább
                        </button>
                    </Box>
                </Center>

                <Box ref={aboutRef} mt={{ base: 8, md: 16 }} mb={{ base: "15vh", md: "30vh" }}>
                    <Box
                        as="div"
                        animation={
                            isVisible
                                ? "slideInFromTop 1s ease-out forwards"
                                : "slideOutToTop 1s ease-out forwards"
                        }
                        initial={{ opacity: 0, transform: "translateY(-100%)" }}
                        textAlign="center"
                        mb={{ base: 4, md: 6 }}
                    >
                        <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold">
                            A játékunkról
                        </Text>
                    </Box>

                    <Flex
                        direction={{ base: "column", md: "row" }}
                        alignItems="center"
                        justifyContent="center"
                        gap={{ base: 2, md: 0 }}
                    >
                        <ImageSlider currentIndex={currentIndex} isVisible={isVisible} />
                        <Box
                            w={{ base: "90%", md: "500px" }}
                            mt={{ base: 4, md: 0 }}
                            textAlign="center"
                            animation={
                                isVisible
                                    ? "slideInFromRight 1s ease-out forwards"
                                    : "slideOutToRight 1s ease-out forwards"
                            }
                            initial={{ opacity: 0, transform: "translateX(100%)" }}
                        >
                            <Text>{texts[currentIndex]}</Text>
                        </Box>
                    </Flex>
                </Box>

                <Box
                    mt={{ base: 6, md: 12 }}
                    p={{ base: 4, md: 6 }}
                    bg="gray.800"
                    borderRadius="lg"
                    boxShadow="lg"
                    color="white"
                    textAlign="center"
                    marginBottom={170}
                >
                    <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold">
                        Játékosaink értékelése
                    </Text>
                    <HStack spacing={{ base: 2, md: 4 }} mt={{ base: 1, md: 2 }} justify="center">
                        {renderStars()}
                        <Text fontSize={{ base: "xl", md: "2xl" }}>
                            ({calculateAverageRating()}/5)
                        </Text>
                    </HStack>
                    <Text fontSize={{ base: "md", md: "lg" }} mt={2}>
                        {ratings.length} értékelés alapján
                    </Text>
                </Box>
            </Container>
        </>
    );
}