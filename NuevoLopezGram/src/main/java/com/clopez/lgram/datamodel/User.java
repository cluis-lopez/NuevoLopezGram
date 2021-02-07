package com.clopez.lgram.datamodel;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import org.springframework.cloud.gcp.data.datastore.core.mapping.Entity;
import org.springframework.data.annotation.Id;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Entity
public class User {
	@Id
	String id;
	
	public String name;
	public String email;
	public String password;
	private Date userSince;
	private Date lastLogin;
	private Date lastActivity;
	private Date lastPost;
	private int numPosts;
	private boolean lockedUser;
	private Set<String> following;//List of uid's of users I follow
	private Set<String> followers;//List of uid's of users that follow me
	private String avatar; //URL to avatar pictute
	
	public User(String name, String email, String password) {
		this.id = UUID.randomUUID().toString();
		this.name = name;
		this.email = email;
		this.userSince = new Date();
		this.lastLogin = new Date(0);
		this.lastActivity = new Date(0);
		this.lastPost = new Date(0);
		this.numPosts = 0;
		this.lockedUser = false;
		this.following = new HashSet<String>();
		this.followers = new HashSet<String>();
		this.password = password;
		this.avatar = "";
	}

	public String getId() {
		return id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getPassword() {
		return password;
	}
	
	public void setPassword(String password) {
		this.password = password;
	}
	
	public void encryptPassword() {
		this.password = new BCryptPasswordEncoder().encode(password);
	}

	public Date getUserSince() {
		return userSince;
	}

	public void setUserSince(Date userSince) {
		this.userSince = userSince;
	}

	public Date getLastLogin() {
		return lastLogin;
	}

	public void setLastLogin(Date lastLogin) {
		this.lastLogin = lastLogin;
	}

	public Date getLastActivity() {
		return lastActivity;
	}

	public void setLastActivity(Date lastActivity) {
		this.lastActivity = lastActivity;
	}

	public Date getLastPost() {
		return lastPost;
	}

	public void setLastPost(Date lastPost) {
		this.lastPost = lastPost;
	}
	
	public int getNumPosts() {
		return numPosts;
	}
	
	public void incNumPosts() {
		this.numPosts += 1;
	}

	public boolean isLockedUser() {
		return lockedUser;
	}

	public void setLockedUser(boolean lockedUser) {
		this.lockedUser = lockedUser;
	}

	public String getAvatar() {
		return avatar;
	}

	public void setAvatar(String avatar) {
		this.avatar = avatar;
	}
	
	public String addFollowing(String uid) {
		following.add(uid);
		return uid;
	}
	
	public String removeFollowing(String uid) {
		if (following.contains(uid)) {
			following.remove(uid);
			return uid;
		} else {
			return null;
		}
	}
	
	public Set<String> getFollowing(){
		return following;
	}
	
	public String addFollower(String uid) {
		followers.add(uid);
		return uid;
	}
	
	public String removeFollower(String uid) {
		if (followers.contains(uid)) {
			followers.remove(uid);
			return uid;
		} else {
			return null;
		}
	}
	
	public Set<String> getFollowers(){
		return followers;
	}
	
	@Override
	public String toString() {
		SimpleDateFormat df = new SimpleDateFormat("YYYY-MM-DD hh:mm:ss");
		return "ID: " + id + " Name: " + name + " email: " + email + " User since: " + df.format(userSince);
	}
		
}
