"use client";
import {Box, Text, Input, Button, VStack, FormControl, FormLabel, Image} from "@chakra-ui/react";
import {supabase} from "../utils/supabaseClient";
import {useEffect, useState} from "react";
import {useRouter} from "next/router";
import Head from "next/head";

export default function Profile() {
    const [user, setUser] = useState(null);
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [profilePic, setProfilePic] = useState(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            const {data: {user}, error: authError} = await supabase.auth.getUser();
            if (authError || !user) {
                console.error("Hiba a felhasználó lekérdezésekor:", authError);
                router.push("/login");
                return;
            }

            console.log("Bejelentkezett felhasználó ID:", user.id);
            setUser(user);
            setEmail(user.email || "");

            const {data: profileData, error: profileError} = await supabase
                .from("profiles")
                .select("username, email")
                .eq("id", user.id)
                .single();

            if (!profileError && profileData) {
                setUsername(profileData.username || "");
                setEmail(profileData.email || user.email || "");
            } else {
                console.warn("Profiladatok lekérdezése sikertelen, fallback a user_metadata-hoz:", profileError);
                setUsername(user.user_metadata?.username || "");
            }

            const {data: picData, error: picError} = await supabase
                .from("profile_pics")
                .select("public_url")
                .eq("user_id", user.id)
                .single();

            if (!picError && picData) {
                setProfilePic(picData.public_url);
                console.log("Profilkép URL betöltve:", picData.public_url);
            } else if (picError && picError.code !== "PGRST116") {
                console.error("Profilkép lekérdezési hiba:", picError);
            }
        };
        fetchUser();
    }, [router]);

    const handleEmailUpdate = async () => {
        setLoading(true);
        try {
            const {error: authError} = await supabase.auth.updateUser({email});
            if (authError) {
                throw new Error("Hiba az autentikációs email frissítésekor: " + authError.message);
            }

            const {error: profileError} = await supabase
                .from("profiles")
                .update({email})
                .eq("id", user.id);

            if (profileError) {
                throw new Error("Hiba a profiles email frissítésekor: " + profileError.message);
            }

            console.log("Email sikeresen frissítve:", email);
            alert("Email sikeresen frissítve!");
            setUser({...user, email});
        } catch (error) {
            console.error("Email frissítési hiba:", error);
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUsernameUpdate = async () => {
        setLoading(true);
        try {
            const {error: profileError} = await supabase
                .from("profiles")
                .upsert(
                    {id: user.id, username},
                    {onConflict: "id"}
                );

            if (profileError) {
                throw new Error("Hiba a profil frissítésekor: " + profileError.message);
            }

            const {error: authError} = await supabase.auth.updateUser({
                data: {username}
            });

            if (authError) {
                throw new Error("Hiba az autentikációs adatok frissítésekor: " + authError.message);
            }

            console.log("Felhasználónév sikeresen frissítve:", username);
            alert("Felhasználónév sikeresen frissítve!");
            setUser({...user, user_metadata: {...user.user_metadata, username}});
        } catch (error) {
            console.error("Felhasználónév frissítési hiba:", error);
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleProfilePicUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        try {
            const fileExt = file.name.split(".").pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            console.log("Feltöltendő fájl neve:", fileName);
            console.log("Felhasználó ID (user.id):", user.id);

            const {data: sessionData, error: sessionError} = await supabase.auth.getSession();
            if (sessionError) {
                throw new Error("Hiba a munkamenet lekérdezésekor: " + sessionError.message);
            }
            const authUid = sessionData?.session?.user?.id;
            console.log("Aktuális auth.uid():", authUid);

            const {error: uploadError} = await supabase.storage
                .from("profile-pics")
                .upload(fileName, file, {upsert: true});
            if (uploadError) {
                throw new Error("Hiba a profilkép feltöltésekor (Storage): " + uploadError.message);
            }
            console.log("Fájl sikeresen feltöltve a Storage-ba");

            const {data: urlData} = supabase.storage.from("profile-pics").getPublicUrl(fileName);
            const publicUrl = urlData.publicUrl;
            console.log("Nyilvános URL:", publicUrl);

            const {data: upsertData, error: dbError} = await supabase
                .from("profile_pics")
                .upsert(
                    {user_id: user.id, file_name: fileName, public_url: publicUrl},
                    {onConflict: "user_id"}
                );
            if (dbError) {
                throw new Error("Hiba a profilkép metaadatainak mentésekor (Adatbázis): " + dbError.message);
            }
            console.log("Adatbázis sikeresen frissítve:", upsertData);

            setProfilePic(publicUrl);
            alert("Profilpytz sikeresen frissítve!");
        } catch (error) {
            console.error("Profilkép feltöltési hiba:", error);
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return <Text textAlign="center">Betöltés...</Text>;
    }

    return (
        <>
            <Head>
                <title>Xcape - Profil</title>
                <link rel="icon" href="/images/icon.png"/>
                <meta name="description" content="Felhasználói profil szerkesztése"/>
            </Head>
            <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" p={4}>
                <VStack spacing={6} maxW="md" w="full" textAlign="center">
                    <Text fontSize="2xl" fontWeight="bold">Profil</Text>
                    <Box>
                        {profilePic ? (
                            <Image
                                src={profilePic}
                                alt="profil_pic"
                                borderRadius="full"
                                boxSize="150px"
                                objectFit="cover"
                                fallbackSrc="/placeholder-profile-pic.jpg"
                            />
                        ) : (
                            <Box
                                w="150px"
                                h="150px"
                                borderRadius="full"
                                bg="gray.200"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                            >
                                <Text>Nincs kép</Text>
                            </Box>
                        )}
                        <FormControl mt={2}>
                            <FormLabel htmlFor="profile-pic" textAlign="center">
                                <Button
                                    as="span"
                                    size="sm"
                                    bg="gray.800"
                                    color="white"
                                    _hover={{bg: "gray.700"}}
                                    isLoading={loading}
                                    isDisabled={loading}
                                >
                                    Profilkép módosítása
                                </Button>
                            </FormLabel>
                            <Input
                                id="profile-pic"
                                type="file"
                                accept="image/*"
                                onChange={handleProfilePicUpload}
                                hidden
                                disabled={loading}
                            />
                        </FormControl>
                    </Box>
                    <FormControl>
                        <FormLabel>Email</FormLabel>
                        <Input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Add meg az email címedet"
                            mb={2}
                            disabled={loading}
                        />
                        <Button
                            onClick={handleEmailUpdate}
                            bg="gray.800"
                            color="white"
                            _hover={{bg: "gray.700"}}
                            isLoading={loading}
                            isDisabled={loading}
                            w="full"
                        >
                            Email frissítése
                        </Button>
                    </FormControl>
                    <FormControl>
                        <FormLabel>Felhasználónév</FormLabel>
                        <Input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Add meg a felhasználónevedet"
                            mb={2}
                            disabled={loading}
                        />
                        <Button
                            onClick={handleUsernameUpdate}
                            bg="gray.800"
                            color="white"
                            _hover={{bg: "gray.700"}}
                            isLoading={loading}
                            isDisabled={loading}
                            w="full"
                        >
                            Felhasználónév frissítése
                        </Button>
                    </FormControl>
                </VStack>
            </Box>
        </>
    );
}