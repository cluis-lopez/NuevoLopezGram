package com.clopez.lgram.controller;

import java.io.IOException;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.clopez.lgram.datamodel.RemovedUser;
import com.clopez.lgram.datamodel.RemovedUserRepository;
import com.clopez.lgram.datamodel.User;
import com.clopez.lgram.datamodel.UserPublic;
import com.clopez.lgram.datamodel.UserRepository;
import com.clopez.lgram.datamodel.jsonStatus;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import com.google.cloud.storage.Storage.BlobTargetOption;
import com.google.cloud.storage.Storage.PredefinedAcl;

import io.jsonwebtoken.Jwts;

@RestController
public class UserController {
	
	@Value("${jwt.secret}")
	String SECRET;
	
	private static Storage storage = StorageOptions.getDefaultInstance().getService();
	
	// Bucket name to store avatar
	@Value("${gcp_storage_bucket}")
	private String bucket;
	@Value("${avatar_folder}")
	private String picFolder;

	@Autowired
	private UserRepository uRep;
	
	@Autowired
	private RemovedUserRepository uremRep;;


	@GetMapping("/api/userdetails")
	public @ResponseBody UserPublic userDetails(@RequestHeader (name="Authorization") String token) {
		String userId = Jwts.parser().setSigningKey(SECRET).parseClaimsJws(token.replace("Bearer", ""))
				.getBody()
				.getSubject();
		Optional<User> u = uRep.findById(userId);
		if (u.isPresent()) {
			UserPublic ud = new UserPublic(u.get());
			return ud;
		} else {
			return null;
		}
	}
	
	@DeleteMapping("/api/userdetails")
	public @ResponseBody jsonStatus deleteUser(@RequestHeader (name="Authorization") String token) {
		String userId = Jwts.parser().setSigningKey(SECRET).parseClaimsJws(token.replace("Bearer", ""))
				.getBody()
				.getSubject();
		Optional<User> u = uRep.findById(userId);
		if (u.isEmpty())
			return new jsonStatus("NOT OK", "Invalid user");
		User user = u.get();
		String email = user.getEmail();
		//Remove user password (even if encrypted) before store it in the removed users database
		user.setPassword("");
		RemovedUser remuser = new RemovedUser(user);
		//Save the deleted user in the queue of removed users
		uremRep.save(remuser);
		//Delete de user from the users database
		uRep.delete(user);
		return new jsonStatus("OK", "User " + email + " with id: "+ userId + " has been deleted");
	}
	
	
	@PostMapping("/api/changepassword")
	public @ResponseBody jsonStatus changePassword(@RequestHeader (name="Authorization") String token,
			@RequestParam String oldPassword, @RequestParam String newPassword){
		String userId = Jwts.parser().setSigningKey(SECRET).parseClaimsJws(token.replace("Bearer", ""))
				.getBody()
				.getSubject();
		Optional<User> u = uRep.findById(userId);
		if (u.isEmpty())
			return new jsonStatus("NOT OK", "Invalid User");
		
		User user = u.get();
		
		BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

		if ( ! passwordEncoder.matches(oldPassword, user.getPassword()))
		    return new jsonStatus("NOT OK", "Invalid Password");
		
		user.setPassword(newPassword);
		user.encryptPassword();
		uRep.save(user);
		return new jsonStatus("OK", "Password updated");
	}
	
	@PostMapping(path = "/api/changeavatar", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
	public Map<String, String> deleteAvatar(@RequestHeader (name="Authorization") String token,
			@RequestPart(value = "file", required = true) MultipartFile files) {
		String userId = Jwts.parser().setSigningKey(SECRET).parseClaimsJws(token.replace("Bearer", ""))
				.getBody()
				.getSubject();
			
		Map<String, String> ret = new HashMap<>();
		ret.put("status", "NOT OK");
		ret.put("message", "Invalid User");
		
		Optional<User> u = uRep.findById(userId);
		if (u.isEmpty())
			return ret;
		
		User user = u.get();
		if (files.getSize() == 1){ //Remove avatar from user
			user.setAvatar("");
			uRep.save(user);
			ret.put("key", "");
			ret.put("status", "OK");
			ret.put("message", "Removed");
			return ret;
		}
		
		//Update the avatar pìcture for this user
		try {
			ret.put("key", upload(files, user.getEmail()));
			user.setAvatar(ret.get("key"));
			uRep.save(user);
			ret.put("status", "OK");
			ret.put("message", "Avatar updated");
		} catch (IOException e) {
			e.printStackTrace();
		}
		
		return ret;
	}
	
	
	@PostMapping("/createuser")
	public @ResponseBody jsonStatus createUser(@RequestParam("name") 
			String name, @RequestParam("email") String email, @RequestParam("password") String password) {
		// Email must be unique
		List<User> ul = uRep.findByEmail(email);
		if ( ! ul.isEmpty())
			return new jsonStatus("NOT OK", email + " Email address already used");
		
		User u = new User(name, email, password);
		u.encryptPassword();
		if (uRep.save(u)!= null)
			return new jsonStatus("OK", "Creado el usuario con Id: "+u.getId()+" Usuarios en la BBDD :"+uRep.count());
		else
			return new jsonStatus("NOT OK", "algo chungo ocurre");
	}
	
	private String upload(MultipartFile file, String email) throws IOException {
		try {
			String blobName = picFolder + "/" + email;
			BlobInfo blobInfo = storage.create(BlobInfo.newBuilder(bucket, blobName).build(), // get original file name
					file.getBytes(), // the file
					BlobTargetOption.predefinedAcl(PredefinedAcl.PUBLIC_READ) // Set file permission
			);
			return blobInfo.getMediaLink(); // Return file url
		} catch (IllegalStateException e) {
			throw new RuntimeException(e);
		}
	}
}
