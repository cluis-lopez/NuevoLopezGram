package com.clopez.lgram.security;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.clopez.lgram.datamodel.UserRepository;

@Service
public class JwtUserDetailsService implements UserDetailsService {

	@Autowired
	private UserRepository uRep;

	@Override
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

		Optional<com.clopez.lgram.datamodel.User> u = uRep.findById(username);
		
		if (u.isPresent()) {
			return new User(u.get().getId(), u.get().getPassword(), new ArrayList<>());
		} else {
			throw new UsernameNotFoundException("Invalid email or email not found : " + username);
		}

	}
}
