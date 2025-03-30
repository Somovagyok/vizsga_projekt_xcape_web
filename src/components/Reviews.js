import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    Textarea,
    VStack,
    useToast,
    Text,
    Stack,
    useBreakpointValue,
    Image,
    Center
} from "@chakra-ui/react";
import {useForm} from "react-hook-form";
import {useEffect, useState} from "react";
import {supabase} from "@/utils/supabaseClient.js";

const ReviewForm = () => {
    const {register, handleSubmit, reset} = useForm();
    const toast = useToast();
    const [reviews, setReviews] = useState([]);
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState("");
    const formWidth = useBreakpointValue({base: "90%", md: "lg"});
    const defaultProfilePic = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSA4F3geRPsxdg2QCVXw-WZrwjWUoJFDWhh2w&s";
    const [visibleReviews, setVisibleReviews] = useState(5);

    const handleShowMore = () => {
        setVisibleReviews(reviews.length);
    };
    useEffect(() => {
        const fetchUserAndReviews = async () => {

            const {data: {user}} = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                const {data: profile, error: profileError} = await supabase
                    .from("profiles")
                    .select("username")
                    .eq("id", user.id)
                    .single();

                if (profileError) {
                    console.error("Hiba a profil lekérdezésekor:", profileError);
                } else {
                    setUsername(profile.username);
                }
            }

            const {data: reviewData, error: reviewError} = await supabase
                .from("reviews")
                .select("id, username, rating, comment, created_at")
                .order("id", {ascending: false});

            if (reviewError) {
                console.error("Hiba a vélemények lekérdezésekor:", reviewError);
                return;
            }
            console.log("Review data:", reviewData);


            const {data: profilesData, error: profilesError} = await supabase
                .from("profiles")
                .select("id, username")
                .in("username", reviewData.map((r) => r.username));

            if (profilesError) {
                console.error("Hiba a profilok lekérdezésekor:", profilesError.message);
                return;
            }
            console.log("Profiles data:", profilesData);

            const {data: profilePicsData, error: picsError} = await supabase
                .from("profile_pics")
                .select("user_id, public_url")
                .in("user_id", profilesData.map((p) => p.id));

            if (picsError) {
                console.error("Hiba a profképek lekérdezésekor:", picsError.message);
                return;
            }
            console.log("Profile pics data:", profilePicsData);

            const formattedReviews = reviewData.map((review) => {
                const profile = profilesData?.find((p) => p.username === review.username);
                const profilePicData = profilePicsData?.find((pic) => pic.user_id === profile?.id);
                const profilePic = profilePicData?.public_url || defaultProfilePic;
                console.log(`Username: ${review.username}, ProfilePic: ${profilePic}`);
                return {
                    ...review,
                    profilePic,
                };
            });

            setReviews(formattedReviews);
        };

        fetchUserAndReviews();

        const {subscription} = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                supabase
                    .from("profiles")
                    .select("username")
                    .eq("id", session.user.id)
                    .single()
                    .then(({data, error}) => {
                        if (!error) setUsername(data.username);
                    });
            } else {
                setUsername("");
            }
        });

        return () => subscription?.unsubscribe();
    }, []);

    const onSubmit = async (data) => {
        if (!user) {
            toast({
                title: "Bejelentkezés szükséges",
                description: "Kérlek, jelentkezz be az értékeléshez!",
                status: "warning",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        const {rating, comment} = data;

        try {
            const {data: newReview, error} = await supabase
                .from("reviews")
                .insert([{username: username, rating: parseInt(rating), comment}])
                .select()
                .single();

            if (error) throw error;

            const {data: profileData, error: profileError} = await supabase
                .from("profiles")
                .select("id, username")
                .eq("username", username)
                .single();

            if (profileError) {
                console.error("Hiba a profil lekérdezésekor:", profileError.message);
            }

            const {data: profilePicData, error: picError} = await supabase
                .from("profile_pics")
                .select("public_url")
                .eq("user_id", profileData?.id)
                .single();

            if (picError && picError.code !== "PGRST116") {
                console.error("Hiba a profkép lekérdezésekor:", picError.message);
            }

            const formattedReview = {
                ...newReview,
                profilePic: profilePicData?.public_url || defaultProfilePic,
            };

            setReviews((prevReviews) => [formattedReview, ...prevReviews]);

            toast({
                title: "Értékelés beküldve.",
                description: "Köszönjük a visszajelzésedet!",
                status: "success",
                duration: 5000,
                isClosable: true,
            });

            reset();
        } catch (error) {
            console.error("Hiba az értékelés beküldésekor:", error.message);
            toast({
                title: "Sikertelen beküldés.",
                description: "Hiba történt az értékelés beküldése közben.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const starcounter = (rating) => {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 > 0;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

        return (
            <Text as="span" display="flex" alignItems="center">
                {Array(fullStars)
                    .fill("★")
                    .map((star, index) => (
                        <Text as="span" key={`full-${index}`} color="yellow.400">
                            {star}
                        </Text>
                    ))}
                {halfStar && (
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

    return (
        <Box minH="100vh" display="flex" flexDirection="column" alignItems="center" p={4}>
            {user && username ? (
                <Box as="form" onSubmit={handleSubmit(onSubmit)} width={formWidth} p={8} boxShadow="xl"
                     borderRadius="lg" bg="white">
                    <Text fontSize={{base: "3xl", md: "6xl"}} textAlign="center" mb={6}>Írj értékelést</Text>
                    <VStack spacing={4} align="stretch">
                        <FormControl>
                            <FormLabel>Felhasználónév</FormLabel>
                            <Input value={username} isDisabled/>
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Értékelés</FormLabel>
                            <Input type="number" placeholder="Írd be 1-től 5-ig" {...register("rating", {
                                required: true,
                                min: 1,
                                max: 5
                            })} />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Komment</FormLabel>
                            <Textarea placeholder="Komment helye" {...register("comment", {required: true})} />
                        </FormControl>

                        <Button type="submit" bg="#333333" color="white" _hover={{bg: "#444444"}} w="full">
                            Értékelés beadása
                        </Button>
                    </VStack>
                </Box>
            ) : (
                <Text fontSize="xl" textAlign="center" mt={10}>
                    Kérlek, jelentkezz be és állíts be egy felhasználónevet az értékelés írásához!
                </Text>
            )}

            <Box p={8} width={formWidth}>
                <Text fontSize={{ base: "2xl", md: "4xl" }} mb={4}>
                    Értékelések
                </Text>
                <Stack spacing={4}>
                    {reviews.length > 0 ? (
                        reviews.slice(0, visibleReviews).map((review) => (
                            <Box
                                key={review.id}
                                p={4}
                                boxShadow="md"
                                borderRadius="lg"
                                bg="gray.100"
                                display="flex"
                                alignItems="center"
                            >
                                <Image
                                    src={review.profilePic}
                                    alt={`${review.username} profilképe`}
                                    boxSize="40px"
                                    borderRadius="full"
                                    mr={3}
                                    fallbackSrc={defaultProfilePic}
                                />
                                <Box>
                                    <Text fontWeight="bold">
                                        {review.username} - {starcounter(review.rating)}
                                    </Text>
                                    <Text>{review.comment}</Text>
                                </Box>
                            </Box>
                        ))
                    ) : (
                        <Text>Még egy értékelés sincsen, legyél te az első!</Text>
                    )}
                </Stack>
                {reviews.length > 5 && visibleReviews < reviews.length && (
                    <Center>
                    <Button
                        mt={4}
                        backgroundColor="#333333"
                        color="white"
                        _hover={{ backgroundColor: "#444444" }}
                        variant="outline"
                        onClick={handleShowMore}
                        alignSelf="center"
                    >
                        Továbbiak
                    </Button>
                    </Center>
                )}
            </Box>
        </Box>
    );
};

export default ReviewForm;