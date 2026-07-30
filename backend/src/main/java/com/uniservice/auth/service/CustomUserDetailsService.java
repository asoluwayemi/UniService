package com.uniservice.auth.service;

import com.uniservice.auth.repository.UserRepository;
import com.uniservice.auth.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService{

    private final UserRepository repository;

    @Override
    public UserDetails loadUserByUsername(String username){
        return repository.findByUsernameOrEmail(username,username)
                .map(UserPrincipal::of)
                .orElseThrow(()->new UsernameNotFoundException(username));
    }
}
